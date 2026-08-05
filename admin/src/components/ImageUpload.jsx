import { useEffect, useState } from "react";
import swiftLogo from "../assets/images/logo/swift.png";
import { convertImageFileToWebp } from "../utils/webpUpload";

const ImageUpload = ({
  value = "",
  onFileSelect,
  label = "Upload Image",
  helperText = "PNG, JPG, JPEG (Frontend brand theme)",
  accept = "image/*",
}) => {
  const [objectUrl, setObjectUrl] = useState("");
  const preview = objectUrl || value || "";

  
  // prevents memory leaks when user changes image many times
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let nextFile = file;
    try {
      nextFile = (await convertImageFileToWebp(file)) || file;
    } catch (error) {
      console.error("Image WebP conversion failed; using original file.", error);
    }

    if (objectUrl) URL.revokeObjectURL(objectUrl);

    const nextUrl = URL.createObjectURL(nextFile);
    setObjectUrl(nextUrl);

    // 
    // parent form needs file for FormData submit to backend
    if (typeof onFileSelect === "function") {
      onFileSelect(nextFile);
    }
  };

  return (
    <label className="block w-full cursor-pointer rounded-xl border border-[#0E70C4]/40 bg-[#0F2350] p-4 transition-colors hover:border-[#0E70C4]">
      <div className="flex items-center gap-3">
        <img src={swiftLogo} alt="Elena IT Services" className="h-8 w-auto" />
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/60">{helperText}</p>
        </div>
      </div>

      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="mt-3 block w-full text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#0E70C4] file:px-3 file:py-2 file:text-white hover:file:bg-[#2d5fe1]"
      />

      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="mt-4 h-36 w-full rounded-lg object-cover"
        />
      ) : null}
    </label>
  );
};

export default ImageUpload;
