"use client";

import Image from "next/image";
import { SignIn as SignInForm } from "./action/component";

export function SignInSection({ isMobile }: { isMobile: boolean }) {

  return (
    <div className="p-4 flex items-center justify-center h-full">
      {isMobile ? (
        <div className="flex items-center justify-center">
          <Image
            src="/name.svg"
            alt="White Node Logo"
            width={2827}
            height={1040}
            className="h-32 w-auto object-contain"
          />
        </div>
      ) : (
        <div className="flex items-start gap-28">
          <div className="h-56 flex items-start justify-center">
            <Image
              src="/name.svg"
              alt="White Node Logo"
              width={2827}
              height={1040}
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="h-56 max-w-md flex flex-col justify-between">
            <SignInForm />
          </div>
        </div>
      )}
    </div>
  );
}
