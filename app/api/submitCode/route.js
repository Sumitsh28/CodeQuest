import dbConnect from "@/utils/dbConnect";
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo.js";
import { SolvedProblem } from "@/models/SolvedProblem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";
import axios from "axios";

export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const userID = session?.user?._id;

  if (!userID) {
    return new Response("User Not Found", { status: 401 });
  }

  const { code, problem, language, contest } = await req.json();

  // 1. Logic from Working API: Language Configuration
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

  const user = await User.findById(userID);
  const userdata = await UserInfo.findById(user.userInfo).populate("solved");
  const prob = await Problem.findOne({ id: problem });

  if (!prob) {
    return Response.json({ error: "Problem not found" }, { status: 404 });
  }

  const existingSolvedProblem = userdata.solved.find((solvedProblem) =>
    solvedProblem.problem.equals(prob._id),
  );

  try {
    // 2. Logic from Working API: Execute via JDoodle Direct API
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: prob.testCases[0].input[0], // Using problem input as stdin
      language: selected.language,
      versionIndex: selected.versionIndex,
    });

    const data = response.data;

    // 3. Logic from Non-Working API: Validation & DB Saving
    let tcPass;
    let isAccepted;

    // Note: You might need to trim() the output if JDoodle adds extra newlines
    if (data.output === prob.testCases[0].output[0]) {
      tcPass = 1;
      isAccepted = "accepted";
    } else {
      tcPass = 0;
      isAccepted = "rejected";
    }

    const newSolution = {
      contest: contest !== null ? contest : undefined,
      code: code,
      complexity: [data.cpuTime, data.memory],
      status: isAccepted,
      passedTestCases: tcPass,
    };

    if (existingSolvedProblem) {
      existingSolvedProblem.solution.push(newSolution);
      await existingSolvedProblem.save();
      return new Response(JSON.stringify({ isAccepted, output: data.output }), {
        status: 201,
      });
    } else {
      if ((isAccepted && contest) || !contest) {
        const newSolve = new SolvedProblem({
          contest: contest !== null ? contest : undefined,
          problem: prob._id,
          solution: [newSolution],
        });
        const newSol = await newSolve.save();
        userdata.solved.push(newSol.id);
        await userdata.save();
        return new Response(
          JSON.stringify({ isAccepted, output: data.output }),
          { status: 201 },
        );
      } else {
        return new Response("Testcase Failed", { status: 400 });
      }
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    return Response.json(
      { error: true, details: error.response?.data },
      { status: 500 },
    );
  }
}
