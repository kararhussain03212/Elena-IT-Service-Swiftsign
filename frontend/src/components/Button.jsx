import { useNavigate } from "react-router-dom";

const Button = ({
  text = "Button",
  to,
  icon,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick();
    if (to) navigate(to);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={[
        // layout
        "group relative z-1 inline-flex items-center overflow-hidden",
        // spacing & text
        "px-[25px] py-[15px] text-[15px] font-semibold capitalize text-white",
        // background — matches --gradient-bg variable
        "bg-[linear-gradient(90deg,#3c72fc_-10.59%,#00060c_300.59%)]",
        // no default border
        "border-none cursor-pointer disabled:cursor-not-allowed",
        // ::before — bottom-left fill (--secondary-color: #0f0d1d)
        "before:absolute before:bottom-0 before:left-0 before:-z-1",
        "before:h-0 before:w-1/2 before:bg-[#0f0d1d]",
        "before:content-[''] before:transition-all before:duration-300 before:ease-in-out",
        "hover:before:h-full",
        // ::after — top-right fill (--secondary-color: #0f0d1d)
        "after:absolute after:right-0 after:top-0 after:-z-1",
        "after:h-0 after:w-1/2 after:bg-[#0f0d1d]",
        "after:content-[''] after:transition-all after:duration-300 after:ease-in-out",
        "hover:after:h-full",
        // press state
        "active:brightness-90 active:scale-[0.98]",
        // responsive (max-width: 575px)
        "max-[575px]:px-[18px] max-[575px]:py-[8px] max-[575px]:text-sm",
        className,
      ].join(" ")}
    >
      {text}

      {/* Arrow icon — slides right on hover, matches --transition */}
      <span className="ml-2 inline-flex items-center transition-all duration-300 ease-in-out group-hover:translate-x-[5px] max-[575px]:ml-[3px] max-[575px]:text-xs">
        {icon ?? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
          </svg>
        )}
      </span>
    </button>
  );
};

export default Button;
