import { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [msg, setMsg] = useState("");
  const senderEmail = process.env.REACT_APP_SENDER_EMAIL ;
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);
  const [emailList, setEmailList] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState("No files attached");
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  function handleSubject(evt) {
    setSubject(evt.target.value);
  }

  function handleMsg(evt) {
    setMsg(evt.target.value);
  }

  function handleAttachment(evt) {
    const file = evt.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentName(file.name);
    } else {
      setAttachmentName("No files attached");
    }
  }

  function handleSchedule(evt) {
    setSchedule(evt.target.checked);
  }

  function handleFile(event) {
    const file = event.target.files[0];
  
    if (!file) {
      console.error("No file selected.");
      return;
    }
  
    const reader = new FileReader();
  
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
  
      try {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const allEmails = new Set(); // Use Set to ensure unique emails
  
        workbook.SheetNames.forEach((sheetName) => {
          const sheetData = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            { header: 1 }
          );
  
          sheetData.forEach((row) => {
            row.forEach((cell) => {
              if (
                typeof cell === "string" &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cell)
              ) {
                allEmails.add(cell); // Add email to the Set
              }
            });
          });
        });
  
        // Convert Set back to an array
        const uniqueEmails = Array.from(allEmails);
  
        setEmailList(uniqueEmails);
        setTotalEmails(uniqueEmails.length);
      } catch (error) {
        console.error("Error parsing file:", error);
      }
    };
  
    reader.onerror = function (e) {
      console.error("File reading error:", e.target.error);
    };
  
    reader.readAsArrayBuffer(file);
  }  
  function resetForm() {
    setMsg("");
    setSubject("");
    setSchedule(false); // Uncheck the schedule checkbox
    setScheduleDate("");
    setScheduleTime("");
    setAttachment(null);
    setAttachmentName("No files attached");
    setEmailList([]);
    setTotalEmails(0);

    // Reset the file input by manually clearing its value
    const fileInput = document.getElementById("attachmentInput");
    if (fileInput) {
      fileInput.value = null;
    }

    const emailFileInput = document.querySelector('input[type="file"]:not(#attachmentInput)');
    if (emailFileInput) {
      emailFileInput.value = null;
    }
  }

  function send() {
    if (!msg || !emailList.length || !subject) {
      toast.error(
        "Please fill in all fields and upload a valid file with email addresses.",
        {
          position: "top-center",
          autoClose: 3000,
          style: { background: "#ff4d4d", color: "#fff" },
        }
      );
      return;
    }

    if (schedule) {
      if (!scheduleDate || !scheduleTime) {
        toast.error("Please select both a date and time for scheduling.", {
          position: "top-center",
          autoClose: 3000,
          style: { background: "#ff4d4d", color: "#fff" },
        });
        return;
      }

      const now = new Date();
      const selectedDateTime = new Date(`${scheduleDate}T${scheduleTime}`);

      if (selectedDateTime <= now) {
        toast.error("Scheduled time must be in the future.", {
          position: "top-center",
          autoClose: 3000,
          style: { background: "#ff4d4d", color: "#fff" },
        });
        return;
      }
    }

    const formData = new FormData();
    formData.append("msg", msg);
    formData.append("emailList", JSON.stringify(emailList));
    formData.append("senderEmail", senderEmail);
    formData.append("subject", subject);
    formData.append("schedule", schedule);

    if (schedule) {
      formData.append("scheduleDate", scheduleDate);
      formData.append("scheduleTime", scheduleTime);
    }

    if (attachment) {
      formData.append("attachment", attachment);
    }

    setStatus(true);

    axios
      .post("https://kathir-s-bulk-mail-backend.onrender.com/sendemail", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (response.data.scheduled) {
          toast.success(
            `Email scheduled successfully for ${scheduleDate} at ${scheduleTime}`,
            {
              position: "top-center",
              autoClose: 3000,
              style: { background: "#4caf50", color: "#fff" },
            }
          );
          setTimeout(() => {
            setStatus(false);
            resetForm();
          }, 3000);
        } else if (response.data.success) {
          toast.success("Email Sent Successfully", {
            position: "top-center",
            autoClose: 3000,
            style: { background: "#4caf50", color: "#fff" },
          });
          setStatus(false);
          resetForm();
        } else {
          toast.error("Failed to send email...", {
            position: "top-center",
            autoClose: 3000,
            style: { background: "#ff4d4d", color: "#fff" },
          });
          setStatus(false);
        }
      })
      .catch((error) => {
        console.error("Error while sending email:", error);
        toast.error("An error occurred while sending the email. Please try again.", {
          position: "top-center",
          autoClose: 3000,
          style: { background: "#ff4d4d", color: "#fff" },
        });
        setStatus(false);
      });
  }

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white text-center flex items-center justify-center py-3 shadow-lg">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-10 h-10 rounded-md mr-3 transition-transform transform hover:scale-105"
        />
        <h1 className="text-3xl font-extrabold tracking-wide">Kathir's Bulk Mail</h1>
      </div>
  
      {/* Sub-header Section */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white text-center py-3 shadow-md">
        <h1 className="font-medium text-lg px-4">We can help you send multiple emails at once!</h1>
      </div>
  
      {/* Main Form Section */}
      <div className="bg-gradient-to-b from-indigo-300 to-purple-400 flex flex-col items-center text-black px-4 py-6">
        <input
          type="email"
          value={senderEmail}
          readOnly
          className="w-[75%] py-2 px-3 outline-none border border-gray-300 rounded-md bg-gray-100 text-gray-700 shadow focus:ring-2 focus:ring-purple-500"
          placeholder="Sender Email"
        />
  
        <input
          type="text"
          onChange={handleSubject}
          value={subject}
          className="w-[75%] py-2 px-3 mt-4 outline-none border border-gray-300 rounded-md shadow focus:ring-2 focus:ring-purple-500"
          placeholder="Enter the email subject"
        />
  
        <textarea
          onChange={handleMsg}
          value={msg}
          className="w-[75%] h-36 py-2 px-3 mt-4 outline-none border border-gray-300 rounded-md shadow focus:ring-2 focus:ring-purple-500"
          placeholder="Enter the email content..."
        ></textarea>
  
        <input
          type="file"
          id="attachmentInput"
          onChange={handleAttachment}
          className="hidden"
        />
        <label
          htmlFor="attachmentInput"
          className="cursor-pointer py-2 px-4 mt-4 border-4 border-dashed rounded-md shadow-md bg-purple-100 hover:bg-purple-200 text-purple-900 transition-all"
        >
          Attach file
        </label>
  
        <p className="mt-2 text-purple-800 font-medium">Attached file: {attachmentName}</p>
  
        <input
          type="file"
          onChange={handleFile}
          className="border-4 border-dashed py-2 px-4 mt-4 mb-4 rounded-md shadow-md bg-purple-100 hover:bg-purple-200 text-purple-900 transition-all"
        ></input>
        <p className="text-base text-purple-800 font-semibold">Total Emails in the file: {totalEmails}</p>
  
        <div className="mt-5 flex items-center">
          <input
            type="checkbox"
            id="schedule"
            onChange={handleSchedule}
            checked={schedule}
            className="hidden peer"
          />
          <label
            htmlFor="schedule"
            className="w-5 h-5 flex items-center justify-center border-2 border-purple-600 rounded-md cursor-pointer peer-checked:bg-purple-900 peer-checked:border-purple-800 transition-all"
          >
            <svg
              className="w-3.5 h-3.5 text-white hidden peer-checked:block"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </label>
          <label htmlFor="schedule" className="ml-2 text-base font-medium text-purple-900">
            Schedule Email
          </label>
        </div>
  
        {schedule && (
          <div className="mt-3 w-[75%] flex justify-between gap-3">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-[48%] py-2 px-3 border border-gray-300 rounded-md shadow focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-[48%] py-2 px-3 border border-gray-300 rounded-md shadow focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
  
        <button
          onClick={send}
          className={`${status ? "bg-gray-500 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-600"
            } text-white w-[35%] rounded-full py-2.5 mt-5 shadow-lg transform transition-transform hover:scale-105 hover:transition-all hover:duration-300 focus:ring-2 focus:ring-purple-500`}
          disabled={status}
        >
          {status ? "Processing..." : "Send"}
        </button>
      </div>
  
      <ToastContainer />
  
      {/* Tailwind Animation Class */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
    </div>
  );  
}
export default App;