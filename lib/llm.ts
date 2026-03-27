type LLMResponse = {
    content: string
}

export async function callLLM(prompt : string): Promise<LLMResponse> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers : {
            "Authorization" : `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type" : "application/json",
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [{
                role: "user",
                content: prompt,
            }]
        })
    })

    if(!res.ok) {
        const text = await res.text()
        throw new Error(`LLM Error: ${text}`)
    }
    const data = await res.json()
    console.log("FULL LLM RESPONSE:", JSON.stringify(data, null, 2));
    return {
        content: data.choices[0].message.content,
    }
}