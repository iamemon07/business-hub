import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { settings } = await getStore();
  const p = settings.payments;
  const methods = [
    p.cod.enabled && { id: "cod" as const, label: "Cash on Delivery", instructions: p.cod.instructions, number: "", accountType: "" },
    p.bkash.enabled && { id: "bkash" as const, label: "bKash", instructions: p.bkash.instructions, number: p.bkash.number, accountType: p.bkash.accountType },
    p.nagad.enabled && { id: "nagad" as const, label: "Nagad", instructions: p.nagad.instructions, number: p.nagad.number, accountType: p.nagad.accountType },
    p.rocket.enabled && { id: "rocket" as const, label: "Rocket", instructions: p.rocket.instructions, number: p.rocket.number, accountType: p.rocket.accountType },
    p.bank.enabled && { id: "bank" as const, label: "Bank Transfer", instructions: p.bank.details, number: "", accountType: "" },
  ].filter((m): m is Exclude<typeof m, false> => Boolean(m));

  return (
    <div className="container-x py-12">
      <h1 className="heading-display mb-10 text-center text-5xl">Checkout</h1>
      <CheckoutForm
        methods={methods}
        shipping={{
          insideLabel: settings.shipping.insideCityLabel,
          outsideLabel: settings.shipping.outsideCityLabel,
          insideFee: settings.shipping.insideFee,
          outsideFee: settings.shipping.outsideFee,
          minDays: settings.shipping.minDays,
          maxDays: settings.shipping.maxDays,
        }}
      />
    </div>
  );
}
