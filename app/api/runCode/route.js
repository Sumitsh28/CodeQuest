import axios from "axios";

export async function POST(req) {
  const { code, input, language } = await req.json();

  const languageConfig = {
    python3: { language: "python3", versionIndex: "3" },
    cpp: { language: "cpp17", versionIndex: "0" },
    java: { language: "java", versionIndex: "4" },
    javascript: { language: "nodejs", versionIndex: "4" },
  };

  const selected = languageConfig[language];

  if (!selected) {
    return Response.json({ error: "Unsupported language" }, { status: 400 });
  }

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: input,
      language: selected.language,
      versionIndex: selected.versionIndex,
    });

    return Response.json(response.data);
  } catch (error) {
    console.error(error.response?.data);
    return Response.json(
      { error: true, details: error.response?.data },
      { status: 500 },
    );
  }
}
