import Image from "next/image";

export const LogoHeader = () => {
  return (
    <div className="flex items-center">
      <Image
        src="/logo.png"
        alt="logo"
        width={200}
        height={200}
        className="size-8 cursor-pointer"
      />
    </div>
  );
};
