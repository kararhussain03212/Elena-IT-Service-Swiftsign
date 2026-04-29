import React from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const SocialIcon = () => {
  return (
    <div className="fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:right-4">
      <ul className="m-0 list-none p-0">
        <li className="mb-[15px]">
          <a
            href="https://www.facebook.com/profile.php?id=61583716060195"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[46px] w-[46px] items-center justify-center text-[18px] text-white transition-all duration-300 ease-in-out hover:-translate-x-1.5 hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.25)] xl:h-[50px] xl:w-[50px] xl:text-[20px]"
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
            className="flex h-[46px] w-[46px] items-center justify-center text-[18px] text-white transition-all duration-300 ease-in-out hover:-translate-x-1.5 hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.25)] xl:h-[50px] xl:w-[50px] xl:text-[20px]"
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
            className="flex h-[46px] w-[46px] items-center justify-center text-[18px] text-white transition-all duration-300 ease-in-out hover:-translate-x-1.5 hover:scale-110 hover:shadow-[0_6px_15px_rgba(0,0,0,0.25)] xl:h-[50px] xl:w-[50px] xl:text-[20px]"
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
