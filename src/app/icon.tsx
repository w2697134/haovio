import { ImageResponse } from "next/og";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366F1 0%, #A855F7 56%, #22D3EE 100%)",
          borderRadius: 56,
          border: "4px solid rgba(229,231,235,0.28)",
          color: "white",
          textShadow: "0 8px 24px rgba(255,255,255,0.14)",
        }}
      >
        <div
          style={{
            fontSize: 156,
            lineHeight: 1,
            fontWeight: 900,
            fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateY(-4px)",
          }}
        >
          维
        </div>
      </div>
    ),
    size
  );
}
