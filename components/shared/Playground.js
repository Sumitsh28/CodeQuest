"use client";
import React, { useEffect, useState } from "react";
import LanguagesDropdown from "../shared/LanguagesDropdown";
import ThemeDropdown from "../shared/ThemeDropdown";
import CodeEditorWindow from "../shared/CodeEditorWindow";
import OutputWindow from "../shared/OutputWindow";
import CustomInput from "../shared/CustomInput";
import { languagesData, mockComments } from "@/constants";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import Timer from "../shared/Timer";
import Loader from "../shared/Loader";
import FontSizeDropdown from "../shared/FontSizeDropdown";

const Playground = ({
  problem = null,
  isForSubmission = true,
  setSubmitted,
}) => {
  const [customInput, setCustomInput] = useState(
    problem?.testCase?.input ? problem.testCase.input[0] : "",
  );
  const [outputDetails, setOutputDetails] = useState(null);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [theme, setTheme] = useState({ value: "dark", label: "Dark" });
  const [language, setLanguage] = useState(languagesData[3]);
  const [code, setCode] = useState(mockComments[language.value]);
  const [fontSize, setFontSize] = useState({ value: "14", label: "14px" });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleFullScreen = () => {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    function exitHandler(e) {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        return;
      }
      setIsFullScreen(true);
    }

    if (document.addEventListener) {
      document.addEventListener("fullscreenchange", exitHandler);
      document.addEventListener("webkitfullscreenchange", exitHandler);
      document.addEventListener("mozfullscreenchange", exitHandler);
      document.addEventListener("MSFullscreenChange", exitHandler);
    }
  }, [isFullScreen]);

  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = async (input) => {
    setIsCodeRunning(true);
    try {
      const res = await fetch("/api/runCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          input,
          language: language.value,
        }),
      });

      const data = await res.json();
      setOutputDetails(data);
    } catch (error) {
      console.error("Error compiling code:", error);
      setOutputDetails({ output: "Error compiling code" });
    } finally {
      setIsCodeRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsCodeSubmitting(true);
    try {
      const res = await fetch("/api/submitCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          problem: problem?.id,
          language: language.value,
        }),
      });
      const data = await res.json();

      if (data.isAccepted === "accepted") {
        if (setSubmitted) {
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 5000);
        }
        setOutputDetails({
          output: "Accepted",
          submitted: true,
          accepted: true,
        });
      } else {
        setOutputDetails({
          output: data.output,
          submitted: true,
          accepted: false,
        });
      }
    } catch (error) {
      console.error("Error submitting code:", error);
    } finally {
      setIsCodeSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex gap-2 justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <LanguagesDropdown
            onSelectChange={(lang) => {
              setLanguage(lang);
              setCode(mockComments[lang.value]);
            }}
          />
          <ThemeDropdown handleThemeChange={(th) => setTheme(th)} />
          <FontSizeDropdown onSelectChange={(f) => setFontSize(f)} />
        </div>
        <div className="flex gap-2 items-center">
          <Timer />
          <button
            onClick={handleFullScreen}
            className="hover:bg-light-3 hover:border-light-4 rounded-lg p-1"
          >
            <div className="h-6 w-6 font-bold text-2xl text-dark-4">
              {!isFullScreen ? (
                <AiOutlineFullscreen />
              ) : (
                <AiOutlineFullscreenExit />
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="!w-full flex-grow flex flex-col items-start pt-4">
        <CodeEditorWindow
          code={code}
          onChange={onChange}
          language={language.value}
          theme={theme.value}
          fontSize={fontSize.value}
          forProblemsPage={false}
        />

        <div className="!w-full min-h-[30%] flex flex-col">
          <div className="flex justify-end items-center gap-3">
            <button
              onClick={() => handleCompile(customInput)}
              disabled={!code}
              className={`px-4 py-2 bg-dark-4 text-light-1 mt-2 rounded-lg text-sm`}
            >
              {isCodeRunning ? <Loader /> : "Run"}
            </button>
            {isForSubmission && (
              <button
                onClick={handleSubmit}
                disabled={!code}
                className={`px-4 py-2 bg-green-600 text-light-1 mt-2 rounded-lg text-sm`}
              >
                {isCodeSubmitting ? <Loader /> : "Submit"}
              </button>
            )}
          </div>

          <div className="flex gap-5 flex-grow max-sm:flex-col">
            <div className="!w-full flex flex-col h-[250px]">
              <h1 className="font-bold text-lg text-[#3F74E5]">Custom Input</h1>
              <CustomInput
                customInput={customInput}
                setCustomInput={setCustomInput}
              />
            </div>
            <OutputWindow
              outputDetails={outputDetails}
              additionalStyles={"h-[250px]"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Playground;
