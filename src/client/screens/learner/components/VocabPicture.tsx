/**
 * Locally drawn vocabulary pictures.
 *
 * Every image is inline SVG defined in this file: no remote request, no stock
 * asset, no CDN. The word the picture depicts is passed to the component and is
 * also given to assistive technology, so a learner using a screen reader gets
 * the same information as one seeing the picture.
 *
 * Adding an image key means adding a case here, which keeps the set closed and
 * typechecked against `VocabMatchSpec["image"]`.
 */

import type { VocabMatchSpec } from "../../../../shared/schemas/exercise";

const PICTURE_LABEL: Record<VocabMatchSpec["image"], string> = {
  apple: "một quả táo đỏ",
  book: "một quyển sách",
  bottle: "một chai nước",
  chair: "một cái ghế",
  cat: "một con mèo",
  dog: "một con chó",
  house: "một ngôi nhà",
  table: "một cái bàn",
  tree: "một cây xanh",
  window: "một cửa sổ",
};

export function VocabPicture({
  image,
  word,
}: {
  image: VocabMatchSpec["image"];
  word: string;
}): React.JSX.Element {
  const description = `${PICTURE_LABEL[image]}. Từ vựng cần tìm: ${word}.`;
  return (
    <svg
      className="vocab-picture"
      viewBox="0 0 200 160"
      role="img"
      aria-label={description}
      focusable="false"
    >
      <rect x="0" y="0" width="200" height="160" rx="14" className="vocab-picture__bg" />
      {drawImage(image)}
      <text x="100" y="150" textAnchor="middle" className="vocab-picture__caption">
        {PICTURE_LABEL[image]}
      </text>
    </svg>
  );
}

/** The drawing itself. Simple shapes, deliberately: nothing that misleads. */
function drawImage(image: VocabMatchSpec["image"]): React.JSX.Element {
  switch (image) {
    case "apple":
      return (
        <g>
          <circle cx="100" cy="82" r="44" className="vocab-picture__ink" />
          <rect x="97" y="30" width="6" height="16" rx="3" className="vocab-picture__ink" />
          <ellipse cx="122" cy="42" rx="16" ry="8" className="vocab-picture__leaf" />
        </g>
      );
    case "book":
      return (
        <g>
          <rect x="46" y="44" width="108" height="80" rx="6" className="vocab-picture__ink" />
          <rect x="52" y="50" width="96" height="68" rx="4" className="vocab-picture__paper" />
          <line x1="100" y1="52" x2="100" y2="116" className="vocab-picture__line" />
        </g>
      );
    case "bottle":
      return (
        <g>
          <rect x="82" y="34" width="36" height="96" rx="12" className="vocab-picture__ink" />
          <rect x="86" y="60" width="28" height="66" rx="8" className="vocab-picture__water" />
          <rect x="90" y="24" width="20" height="14" rx="4" className="vocab-picture__ink" />
        </g>
      );
    case "chair":
      return (
        <g>
          <rect x="60" y="26" width="80" height="18" rx="5" className="vocab-picture__ink" />
          <rect x="60" y="44" width="80" height="58" rx="6" className="vocab-picture__paper" />
          <rect x="66" y="102" width="12" height="30" rx="4" className="vocab-picture__ink" />
          <rect x="122" y="102" width="12" height="30" rx="4" className="vocab-picture__ink" />
        </g>
      );
    case "cat":
      return (
        <g>
          <circle cx="100" cy="90" r="34" className="vocab-picture__ink" />
          <polygon points="76,64 70,38 94,54" className="vocab-picture__ink" />
          <polygon points="124,64 130,38 106,54" className="vocab-picture__ink" />
          <circle cx="88" cy="86" r="4" className="vocab-picture__paper" />
          <circle cx="112" cy="86" r="4" className="vocab-picture__paper" />
        </g>
      );
    case "dog":
      return (
        <g>
          <circle cx="100" cy="88" r="34" className="vocab-picture__ink" />
          <ellipse cx="70" cy="88" rx="12" ry="20" className="vocab-picture__ink" />
          <ellipse cx="130" cy="88" rx="12" ry="20" className="vocab-picture__ink" />
          <circle cx="90" cy="84" r="4" className="vocab-picture__paper" />
          <circle cx="110" cy="84" r="4" className="vocab-picture__paper" />
          <ellipse cx="100" cy="100" rx="10" ry="7" className="vocab-picture__paper" />
        </g>
      );
    case "house":
      return (
        <g>
          <polygon points="100,28 156,70 44,70" className="vocab-picture__ink" />
          <rect x="56" y="70" width="88" height="56" className="vocab-picture__paper" />
          <rect x="88" y="88" width="24" height="38" className="vocab-picture__ink" />
        </g>
      );
    case "table":
      return (
        <g>
          <rect x="40" y="72" width="120" height="12" rx="4" className="vocab-picture__ink" />
          <rect x="52" y="84" width="10" height="44" rx="4" className="vocab-picture__ink" />
          <rect x="138" y="84" width="10" height="44" rx="4" className="vocab-picture__ink" />
        </g>
      );
    case "tree":
      return (
        <g>
          <circle cx="100" cy="70" r="40" className="vocab-picture__leaf" />
          <rect x="92" y="104" width="16" height="36" rx="4" className="vocab-picture__ink" />
        </g>
      );
    case "window":
      return (
        <g>
          <rect x="48" y="36" width="104" height="94" rx="8" className="vocab-picture__ink" />
          <rect x="58" y="46" width="84" height="74" rx="4" className="vocab-picture__sky" />
          <line x1="100" y1="46" x2="100" y2="120" className="vocab-picture__line" />
          <line x1="58" y1="83" x2="142" y2="83" className="vocab-picture__line" />
        </g>
      );
  }
}
