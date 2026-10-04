import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const FREE_SHIPPING_MIN = 999;
const SHIPPING_FEE = 79;
const EXPRESS_FEE = 149;

const Input = z.object({
  email: z.string().trim().email().max(255),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+\s-]{10,15}$/),
  address1: z.string().trim().min(3).max(200),
  address2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/),
  delivery: z.enum(["standard", "express"]),
  payment: z.enum(["cod", "upi"]),
  upiRef: z.string().trim().max(40).default(""),
  coupon: z.string().trim().max(40).default(""),
  acceptTerms: z.literal(true),
  marketingConsent: z.boolean().default(false),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().max(10),
        color: z.string().max(40),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
});

export type PlaceOrderResult = { ok: true; orderNumber: string } | { ok: false; message: string };

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.payment === "upi" && data.upiRef.length < 6)
      return { ok: false, message: "Please enter your UPI transaction ID." };

    // Optional signed-in user
    let userId: string | null = null;
    const auth = getRequestHeader("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id,slug,title,price,stock,images,sizes,status")
      .in("id", ids);
    if (error) return { ok: false, message: "Could not load products. Try again." };
    const map = new Map(products.map((p) => [p.id, p]));

    const need = new Map<string, number>();
    for (const i of data.items) need.set(i.productId, (need.get(i.productId) ?? 0) + i.quantity);
    for (const [id, q] of need) {
      const p = map.get(id);
      if (!p || p.status !== "active") return { ok: false, message: "An item in your cart is no longer available." };
      if (p.stock < q) return { ok: false, message: `Only ${p.stock} left of ${p.title}. Please update your cart.` };
    }

    const subtotal = data.items.reduce((s, i) => s + map.get(i.productId)!.price * i.quantity, 0);
    let discount = 0;
    let couponCode: string | null = null;
    if (data.coupon) {
      const { data: c } = await supabaseAdmin
        .from("coupons")
        .select("code,kind,value,min_order,active")
        .eq("code", data.coupon.toUpperCase())
        .maybeSingle();
      if (!c || !c.active) return { ok: false, message: "That coupon isn't valid." };
      if (subtotal < c.min_order) return { ok: false, message: `Coupon needs an order of ₹${c.min_order} or more.` };
      discount = Math.min(subtotal, c.kind === "percent" ? Math.round((subtotal * c.value) / 100) : c.value);
      couponCode = c.code;
    }
    const { data: settings } = await supabaseAdmin.from("store_settings").select("free_shipping_threshold,policy_version").eq("id", 1).maybeSingle();
    const freeMin = settings?.free_shipping_threshold ?? FREE_SHIPPING_MIN;
    const shipping = data.delivery === "express" ? EXPRESS_FEE : subtotal >= freeMin ? 0 : SHIPPING_FEE;
    const now = new Date().toISOString();
    const total = subtotal - discount + shipping;

    const { data: order, error: oe } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email: data.email.toLowerCase(),
        full_name: data.fullName,
        phone: data.phone,
        address_line1: data.address1,
        address_line2: data.address2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        delivery_method: data.delivery,
        payment_method: data.payment,
        payment_reference: data.payment === "upi" ? data.upiRef : null,
        payment_status: data.payment === "upi" ? "awaiting_verification" : "pending",
        subtotal,
        discount,
        shipping,
        total,
        coupon_code: couponCode,
        terms_accepted: true,
        terms_accepted_at: now,
        policy_version: settings?.policy_version ?? "1.0",
        marketing_consent: data.marketingConsent,
        marketing_consent_at: data.marketingConsent ? now : null,
      })
      .select("id,order_number")
      .single();
    if (oe || !order) {
      console.error("order insert", oe?.message);
      return { ok: false, message: "Could not place your order. Please try again." };
    }

    const { error: ie } = await supabaseAdmin.from("order_items").insert(
      data.items.map((i) => {
        const p = map.get(i.productId)!;
        return {
          order_id: order.id,
          product_id: p.id,
          slug: p.slug,
          title: p.title,
          image: p.images[0] ?? "",
          size: i.size,
          color: i.color,
          unit_price: p.price,
          quantity: i.quantity,
        };
      }),
    );
    if (ie) {
      console.error("items insert", ie.message);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return { ok: false, message: "Could not place your order. Please try again." };
    }

    for (const [id, q] of need) {
      const p = map.get(id)!;
      await supabaseAdmin.from("products").update({ stock: Math.max(0, p.stock - q) }).eq("id", id);
    }
    return { ok: true, orderNumber: order.order_number };
  });

export const getOrderConfirmation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ orderNumber: z.string().max(30), email: z.string().max(255) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("order_number,full_name,email,city,pincode,payment_method,payment_status,status,subtotal,discount,shipping,total,delivery_method,order_items(title,size,color,quantity,unit_price,image)")
      .eq("order_number", data.orderNumber)
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    return o;
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ orderNumber: z.string().trim().min(4).max(30), contact: z.string().trim().min(5).max(255) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin
      .from("orders")
      .select("order_number,email,phone,city,pincode,status,payment_method,payment_status,tracking_number,delivery_method,total,created_at,updated_at,order_items(title,size,color,quantity,image)")
      .eq("order_number", data.orderNumber.toUpperCase())
      .maybeSingle();
    if (!o) return null;
    const c = data.contact.toLowerCase();
    const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
    const ok = c.includes("@") ? o.email.toLowerCase() === c : digits(c).length === 10 && digits(o.phone) === digits(c);
    if (!ok) return null;
    const { email: _e, phone: _p, ...safe } = o;
    return safe;
  });
