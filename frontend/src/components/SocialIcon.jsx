import React from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const SocialIcon = () => {
  return (
    <div className="fixed top-[40%] right-0 mr-[15px] -translate-y-1/2 z-40">
      <ul className="m-0 list-none p-0">
        <li className="mb-[15px]">
          <a
            href="https://www.facebook.com/profile.php?id=61583716060195"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] w-[50px] items-center justify-center text-[20px] text-white transition-all duration-300 ease-in-out hover:-translate-x-2 hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.25)]"
            style={{ backgroundColor: "#1877F2" }}
            aria-label="Facebook"
          >
            <FaFacebookF />
          </a>
        </li>
        <li className="mb-[15px]">
          <a
            href="https://www.linkedin.com/company/swift-sign-it-cyber-solutions/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] w-[50px] items-center justify-center text-[20px] text-white transition-all duration-300 ease-in-out hover:-translate-x-2 hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.25)]"
            style={{ backgroundColor: "#0a66c2" }}
            aria-label="LinkedIn"
          >
            <FaLinkedinIn />
          </a>
        </li>
        <li>
          <a
            href="https://www.instagram.com/ssitandcybersolutions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] w-[50px] items-center justify-center text-[20px] text-white transition-all duration-300 ease-in-out hover:-translate-x-2 hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.25)]"
            style={{
              background:
                "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            }}
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
        </li>
      </ul>
    </div>
  );
};

export default SocialIcon;
