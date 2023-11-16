import "./components.css";

export function Loading({ classname }: { classname?: string }) {
  return (
    <div className="fixed h-full w-full flex top-0 left-1/2 -translate-x-1/2 z-50 justify-center items-center bg-dark">
      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className={classname}
      >
        <rect className="spinner_zWVm" x="1" y="1" width="7.33" height="7.33" />
        <rect
          className="spinner_gfyD"
          x="8.33"
          y="1"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_T5JJ"
          x="1"
          y="8.33"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_E3Wz"
          x="15.66"
          y="1"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_g2vs"
          x="8.33"
          y="8.33"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_ctYB"
          x="1"
          y="15.66"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_BDNj"
          x="15.66"
          y="8.33"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_rCw3"
          x="8.33"
          y="15.66"
          width="7.33"
          height="7.33"
        />
        <rect
          className="spinner_Rszm"
          x="15.66"
          y="15.66"
          width="7.33"
          height="7.33"
        />
      </svg>
    </div>
  );
}
