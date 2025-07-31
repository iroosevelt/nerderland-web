import * as React from "react";
import { SVGProps } from "react";
const FolderIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={30}
    height={30}
    fill="none"
    {...props}
  >
    <path
      fill="#FFF200"
      d="M4.165 25.078h22.02a.82.82 0 0 0 .815-.816V7.99a.82.82 0 0 0-.816-.815H15.04c-.31 0-.583-.156-.7-.427l-.66-1.32A.818.818 0 0 0 12.982 5H3.816A.82.82 0 0 0 3 5.816v18.097c0 .621.505 1.165 1.165 1.165Z"
    />
  </svg>
);
export default FolderIcon;
