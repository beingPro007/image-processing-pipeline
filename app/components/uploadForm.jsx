"use client";
import { useState } from "react";

export default function UploadForm() {
  const [compressedUrl, setCompressedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { jobId } = await response.json();

      const ws = new WebSocket("wss://localhost:3001");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.jobId === jobId) {
          setCompressedUrl(data.url);
          setLoading(false);
          ws.close();
        }
      };
    } catch (err) {
      setError("Upload failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 text-center">
        <h2 className="text-xl font-semibold mb-4">Upload an Image</h2>
        <input
          type="file"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
          onChange={(e) => handleUpload(e.target.files[0])}
          disabled={loading}
        />
        {loading && <p className="mt-4 text-gray-600">Processing...</p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
        {compressedUrl && (
          <img
            src={compressedUrl}
            alt="Compressed"
            className="mt-4 rounded-lg w-full h-auto"
          />
        )}
      </div>
    </div>
  );
}
