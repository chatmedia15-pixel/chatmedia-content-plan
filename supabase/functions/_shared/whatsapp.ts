export async function sendWhatsAppMessage(message: string) {
  const apiKey = Deno.env.get("WATZAP_API_KEY");
  const numberKey = Deno.env.get("WATZAP_NUMBER_KEY");
  const groupId = Deno.env.get("WATZAP_GROUP_ID");

  if (!apiKey || !numberKey || !groupId) {
    return { success: false, error: "Credentials missing" };
  }

  try {
    const res = await fetch("https://api.watzap.id/v1/send_message_group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        number_key: numberKey,
        group_id: groupId,
        message,
      }),
    });

    const data = await res.json();
    if (data.status === 200 || data.status === "200") {
      return { success: true };
    }
    return { success: false, error: data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown",
    };
  }
}
