"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

export default function UploadForm() {
  const [compressedUrl, setCompressedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Waiting for upload...");

  useEffect(() => {
    socket.on("Job Processing", () => {
      setStatus("Processing...");
    });

    socket.on("Job Compressed", () => {
      setStatus("Compression Completed!");
    });

    socket.on("Job Uploaded", (data) => {
      if (data.url) {
        setCompressedUrl(data.url);
        setStatus("Upload Successful! ✅");
        setLoading(false);
      }
    });

    socket.on("Job Failed", (data) => {
      setError(data.status || "Something went wrong.");
      setLoading(false);
    });

    return () => {
      socket.off("Job Processing");
      socket.off("Job Compressed");
      socket.off("Job Uploaded");
      socket.off("Job Failed");
    };
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    setStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { jobId } = await response.json();

      socket.emit("track-job", { jobId });
    } catch (err) {
      setError("Upload failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h2 className="text-xl font-semibold mb-4">Upload an Image</h2>
        <input
          type="file"
          className="block w-full text-sm text-gray-500 
                     file:mr-4 file:py-2 file:px-4 file:rounded-lg 
                     file:border-0 file:text-sm file:font-semibold 
                     file:bg-blue-500 file:text-white 
                     hover:file:bg-blue-600 cursor-pointer"
          onChange={(e) => handleUpload(e.target.files[0])}
          disabled={loading}
        />

        <p className="mt-4 text-gray-600">{status}</p>
        {loading && <p className="mt-4 text-gray-600">Processing...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
        {compressedUrl && (
          <a
            href={compressedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-blue-500 underline break-all"
          >
            {compressedUrl}
          </a>
        )}
      </div>
    </div>
  );
}
