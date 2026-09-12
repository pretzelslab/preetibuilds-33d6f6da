// Client-side helper for verifying the portfolio owner's master code without
// the actual secret ever appearing in shipped source. The comparison happens
// server-side in api/verify-master-code.ts against process.env.PORTFOLIO_MASTER_CODE.
export async function verifyMasterCode(code: string): Promise<boolean> {
  try {
    const res = await fetch("/api/verify-master-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.valid === true;
  } catch {
    return false;
  }
}
