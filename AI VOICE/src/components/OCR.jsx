import React, { useState } from "react";
import Together from "together-ai";
import fs from "fs";

const OCRComponent = () => {
  const [filePath, setFilePath] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  const apiKey = import.meta.env.VITE_TOGETHER_API_KEY;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64File = reader.result.split(",")[1];
      try {
        setLoading(true);
        const result = await ocr({
          filePath: base64File,
          apiKey,
          model: "Llama-3.2-90B-Vision",
        });
        setMarkdown(result);
      } catch (error) {
        console.error("OCR Error:", error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const ocr = async ({ filePath, apiKey, model = "Llama-3.2-90B-Vision" }) => {
    const visionLLM =
      model === "free"
        ? "meta-llama/Llama-Vision-Free"
        : `meta-llama/${model}-Instruct-Turbo`;

    const together = new Together({
      apiKey,
    });

    const finalMarkdown = await getMarkDown({
      together,
      visionLLM,
      filePath,
    });

    return finalMarkdown;
  };

  const getMarkDown = async ({ together, visionLLM, filePath }) => {
    const systemPrompt = `Convert the provided image into Markdown format. Ensure that all content from the page is included, such as headers, footers, subtexts, images (with alt text if possible), tables, and any other elements.

    Requirements:

    - Output Only Markdown: Return solely the Markdown content without any additional explanations or comments.
    - No Delimiters: Do not use code fences or delimiters like \`\`\`markdown.
    - Complete Content: Do not omit any part of the page, including headers, footers, and subtext.
    `;

    const finalImageUrl = isRemoteFile(filePath)
      ? filePath
      : `data:image/jpeg;base64,${filePath}`;

    const output = await together.chat.completions.create({
      model: visionLLM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image_url",
              image_url: {
                url: finalImageUrl,
              },
            },
          ],
        },
      ],
    });

    return output.choices[0].message.content;
  };

  const isRemoteFile = (filePath) => {
    return filePath.startsWith("http://") || filePath.startsWith("https://");
  };

  return (
    <div className="ocr-component">
      <h2>OCR Component</h2>
      <input
      id="input-area"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="file-input"
      />
      {loading ? (
        <p>Processing...</p>
      ) : (
        markdown && (
          <div className="markdown-output">
            <h3>Extracted Markdown:</h3>
            <pre>{markdown}</pre>
          </div>
        )
      )}
    </div>
  );
};

export default OCRComponent;
