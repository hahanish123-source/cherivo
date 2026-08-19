"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";

type Block = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  heading: string;
  text: string;
  emoji: string;
  font?: string;
  accent?: string;
  headingColor?: string;
  emojiColor?: string;
  headingSize?: number;
  bodySize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  titleFont?: string;
  subtitleFont?: string;
  headingFont?: string;
  bodyFont?: string;
  subtitleColor?: string;
  bodyColor?: string;
  cardColor?: string;
  cardOpacity?: number;
  letterColor?: string;
  letterSize?: number;
  letterLineHeight?: number;
  letterAlign?: "left"|"center"|"right";
  radius?: number;
  image?: string;
  images?: string[];
  imageAdjustments?: Record<string, { scale: number; x: number; y: number }>;
  imageOpacity?: number;
  audioName?: string;
  audioUrl?: string;
  memoryVideo?: string;
  galleryLayout?: string;
  visible?: boolean;
  items?: {
    id: string;
    title: string;
    text: string;
    emoji: string;
  }[];
};

export type Project = {
  blocks: Block[];
  theme?: string;
  background?: string;
  globalFont?: string;
  globalTextColor?: string;
  globalCardOpacity?: number;
  globalRadius?: number;
  globalSpacing?: number;
  globalMotion?: string;
  audioName?: string;
  audioUrl?: string;
  backgroundOverlay?: number;
  customBg?: string;
  customBgOpacity?: number;
  customBgScale?: number;
  customBgPositionX?: number;
  customBgPositionY?: number;
};

const themes: Record<string, [string, string, string, string]> = {
  dark: ["#0b0810", "#ff4f8b", "#ff9fc2", "#fff7fb"],
  light: ["#fff7f4", "#d34f75", "#a23d60", "#2d2027"],
  system: ["#101015", "#e879a0", "#f4a6c0", "#f8f7fb"],
  romantic: ["#160914", "#ff3d78", "#ff86b0", "#fff4f8"],
  dreamy: ["#0d1020", "#9b7cff", "#cbbdff", "#f7f5ff"],
};

const backgrounds: Record<string, string> = {
  aurora:
    "radial-gradient(circle at 12% 18%, rgba(255,61,120,.52), transparent 28%), radial-gradient(circle at 88% 18%, rgba(124,92,255,.58), transparent 30%), radial-gradient(circle at 72% 82%, rgba(34,211,238,.26), transparent 28%), linear-gradient(135deg,#090713,#21102e 48%,#070914)",

  mesh:
    "radial-gradient(circle at 15% 20%, rgba(255,70,150,.64), transparent 25%), radial-gradient(circle at 82% 18%, rgba(126,87,255,.62), transparent 28%), radial-gradient(circle at 72% 78%, rgba(0,220,210,.34), transparent 26%), linear-gradient(120deg,#130a18,#27123a 45%,#08141b)",

  gradient:
    "linear-gradient(125deg,#ff4f8b,#a855f7 38%,#38bdf8 72%,#111827)",

  stars:
    "linear-gradient(145deg,#070611,#15102b 55%,#050611)",

  minimal:
    "radial-gradient(circle at 50% 15%, rgba(255,255,255,.16), transparent 28%), linear-gradient(180deg,#17131b,#0a090d)",

  petals:
    "radial-gradient(circle at 12% 18%,#ff91bb55,transparent 25%), radial-gradient(circle at 82% 22%,#ffd4e855,transparent 25%), linear-gradient(145deg,#1a0b16,#26132b 55%,#0a0710)",
};

function getFont(f?: string) {
  if (f === "script") return "var(--script)";
  if (f === "serif") return "var(--serif)";
  if (f === "caveat") return "var(--caveat)";
  return "var(--sans)";
}

export default function GreetingClient({
  project,
  title,
}: {
  project: Project;
  title: string;
}) {
  const pages = useMemo(
    () => (project.blocks ?? []).filter((b) => b.visible !== false),
    [project.blocks]
  );

  const [i, setI] = useState(0);

  const [secret, setSecret] = useState(false);

  const [candles, setCandles] = useState([
    false,
    false,
    false,
  ]);

  const [smoke, setSmoke] = useState<number[]>([]);

  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [galleryViewer, setGalleryViewer] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  const [dustedPhotos, setDustedPhotos] = useState<number[]>([]);

  const p =
    pages.length > 0
      ? pages[Math.min(i, pages.length - 1)]
      : undefined;

  const audio = p?.audioUrl || project.audioUrl;
  const audioName = p?.audioName || project.audioName;

  function attemptAudioPlayback() {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    void audioElement.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !audio) return;
    audioElement.src = audio;
    audioElement.loop = true;
    audioElement.load();

    const retryAfterInteraction = () => attemptAudioPlayback();
    document.addEventListener("pointerdown", retryAfterInteraction, { once: true });
    document.addEventListener("keydown", retryAfterInteraction, { once: true });
    attemptAudioPlayback();

    return () => {
      document.removeEventListener("pointerdown", retryAfterInteraction);
      document.removeEventListener("keydown", retryAfterInteraction);
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
      setPlaying(false);
    };
  }, [audio]);

  const next = () => {
    setI((x) =>
      Math.min(
        x + 1,
        Math.max(pages.length - 1, 0)
      )
    );
  };

  /*
   * Safely collect gallery images.
   */
  const galleryImages = p
    ? p.images && p.images.length > 0
      ? p.images
      : p.image
      ? [p.image]
      : []
    : [];

  /*
   * Normal gallery:
   * clicking opens the photo viewer.
   */
  const openGalleryPhoto = (
    images: string[],
    index: number
  ) => {
    setGalleryViewer({
      images,
      index,
    });
  };

  /*
   * Close photo viewer.
   */
  const closeGalleryPhoto = () => {
    setGalleryViewer(null);
  };

  /*
   * Previous photo.
   */
  const galleryPrev = () => {
    setGalleryViewer((viewer) => {
      if (!viewer) return null;

      return {
        ...viewer,
        index:
          (viewer.index - 1 + viewer.images.length) %
          viewer.images.length,
      };
    });
  };

  /*
   * Next photo.
   */
  const galleryNext = () => {
    setGalleryViewer((viewer) => {
      if (!viewer) return null;

      return {
        ...viewer,
        index:
          (viewer.index + 1) %
          viewer.images.length,
      };
    });
  };

  /*
   * SCATTERED MEMORY EFFECT
   *
   * Clicking a scattered photo does NOT open it.
   * Instead it disappears.
   *
   * CSS can animate .photo-dusted into a
   * dust / Avengers-style disappearance.
   */
  const scatterPhoto = (index: number) => {
    setDustedPhotos((current) => {
      if (current.includes(index)) {
        return current;
      }

      return [...current, index];
    });
  };

  /*
   * Candle interaction.
   *
   * Each click turns off one candle.
   * Smoke is shown temporarily.
   */
  const blow = () => {
    const candleIndex = candles.findIndex(
      (candle) => !candle
    );

    if (candleIndex === -1) {
      return;
    }

    const updatedCandles = [...candles];

    updatedCandles[candleIndex] = true;

    setCandles(updatedCandles);

    setSmoke((current) => [
      ...current,
      candleIndex,
    ]);

    window.setTimeout(() => {
      setSmoke((current) =>
        current.filter(
          (value) => value !== candleIndex
        )
      );
    }, 2200);

    /*
     * When all candles are blown,
     * automatically move to the next page.
     */
    if (updatedCandles.every(Boolean)) {
      window.setTimeout(() => {
        setI((current) =>
          Math.min(
            current + 1,
            Math.max(pages.length - 1, 0)
          )
        );
      }, 1600);
    }
  };

  /*
   * Theme.
   */
  const theme =
    themes[project.theme || "dark"] ??
    themes.dark;

  /*
   * Global greeting styling.
   */
  const style = {
    "--accent": theme[1],
    "--accent2": theme[2],
    "--global-theme-text":
      project.globalTextColor || theme[3],

    background:
      backgrounds[
        project.background || "aurora"
      ] ?? backgrounds.aurora,

    fontFamily: getFont(project.globalFont),
    "--story-spacing": `${project.globalSpacing ?? 18}px`,
    "--global-radius": `${project.globalRadius ?? 34}px`,
  } as React.CSSProperties;

  return (
    <main
      className={`publicGreeting theme-${
        project.theme || "dark"
      } motion-${
        project.globalMotion || "cinematic"
      }`}
      style={style}
    >
      {/* =========================================================
          PHOTO LIGHTBOX
         ========================================================= */}

      {galleryViewer && (
        <div
          className="galleryLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Memory photo viewer"
          onClick={closeGalleryPhoto}
        >
          <button
            type="button"
            className="galleryLightboxClose"
            aria-label="Close photo viewer"
            onClick={closeGalleryPhoto}
          >
            ×
          </button>

          <button
            type="button"
            className="galleryLightboxNav prev"
            aria-label="Previous photo"
            onClick={(event) => {
              event.stopPropagation();
              galleryPrev();
            }}
          >
            ‹
          </button>

          <div
            className="galleryLightboxContent"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              key={galleryViewer.index}
              src={
                galleryViewer.images[
                  galleryViewer.index
                ]
              }
              alt={`Memory ${
                galleryViewer.index + 1
              }`}
            />

            <span>
              {galleryViewer.index + 1} /{" "}
              {galleryViewer.images.length}
            </span>
          </div>

          <button
            type="button"
            className="galleryLightboxNav next"
            aria-label="Next photo"
            onClick={(event) => {
              event.stopPropagation();
              galleryNext();
            }}
          >
            ›
          </button>
        </div>
      )}

      {/* =========================================================
          CUSTOM BACKGROUND IMAGE
         ========================================================= */}

      {project.customBg && (
        <div
          className="publicBg"
          style={{
            backgroundImage: `url("${project.customBg}")`,
            opacity:
              (project.customBgOpacity ?? 100) /
              100,
            backgroundSize: `${project.customBgScale ?? 100}%`,
            backgroundPosition: `${project.customBgPositionX ?? 50}% ${project.customBgPositionY ?? 50}%`,
          }}
        />
      )}

      {project.customBg && (
        <div className="publicMediaOverlay" style={{ opacity: (project.backgroundOverlay ?? 18) / 100 }} />
      )}

      {/* =========================================================
          TOP BAR
         ========================================================= */}

      <div className="publicTop">
        <span>
          HANORA
          <span>•</span>
        </span>

        <small>{title}</small>

        <button
          type="button"
          onClick={() => {
            setI(0);
            setSecret(false);
            setDustedPhotos([]);
            setCandles([
              false,
              false,
              false,
            ]);
          }}
        >
          <RotateCcw size={14} />
          Replay
        </button>
      </div>

      {/* =========================================================
          MAIN GREETING CARD
         ========================================================= */}

      <section className="publicCard">
        {/* Progress */}
        <div className="publicProgress">
          {pages.map((page, index) => (
            <i
              key={page.id || index}
              className={
                index <= i ? "on" : ""
              }
            />
          ))}
        </div>

        <div
          className="publicScene"
          key={p?.id || "empty"}
          style={p ? {
            "--title-font": getFont(p.titleFont || p.font),
            "--subtitle-font": getFont(p.subtitleFont || p.font),
            "--heading-font": getFont(p.headingFont || p.font),
            "--body-font": getFont(p.bodyFont || p.font),
            "--local": p.accent,
            "--heading-color": p.headingColor,
            "--subtitle-color": p.subtitleColor,
            "--body-color": p.bodyColor,
            "--emoji-color": p.emojiColor,
            "--card-color": p.cardColor,
            "--section-card-opacity": `${p.cardOpacity ?? 8}%`,
            "--card-radius": `${p.radius ?? project.globalRadius ?? 22}px`,
            "--body-size": `${p.bodySize ?? 17}px`,
            "--line-height": p.lineHeight ?? 1.7,
            "--letter-spacing": `${p.letterSpacing ?? 0}px`,
          } as React.CSSProperties : undefined}
        >
          {/* =====================================================
              EMPTY
             ===================================================== */}

          {!p ? (
            <h1>Nothing to show</h1>
          ) : p.type === "gallery" ||
            p.type === "memories" ? (
            <>
              {/* =================================================
                  GALLERY / MEMORIES
                 ================================================= */}

              <div className="publicEmoji">
                {p.emoji}
              </div>

              <div className="eyebrow">
                {p.subtitle}
              </div>

              <h1
                style={{
                  fontSize: p.headingSize,
                  color: p.headingColor,
                }}
              >
                {p.heading}
              </h1>

              <p>{p.text}</p>

              {galleryImages.length > 0 ? (
                <>
                  <div className="publicGallery">
                    <div
                      className={`publicGalleryStage layout-${
                        p.galleryLayout ||
                        "collage"
                      }`}
                    >
                      {galleryImages.map(
                        (src, index) => {
                          const isScattered =
                            p.galleryLayout ===
                            "scattered";

                          const isDusted =
                            dustedPhotos.includes(
                              index
                            );

                          return (
                            <button
                              type="button"
                              className={`publicGalleryItem ${
                                isDusted
                                  ? "photo-dusted"
                                  : ""
                              }`}
                              key={`${index}-${src.slice(
                                -10
                              )}`}
                              aria-label={
                                isScattered
                                  ? `Make memory ${
                                      index + 1
                                    } disappear`
                                  : `Open memory photo ${
                                      index + 1
                                    }`
                              }
                              onClick={() => {
                                if (
                                  isScattered
                                ) {
                                  scatterPhoto(
                                    index
                                  );
                                } else {
                                  openGalleryPhoto(
                                    galleryImages,
                                    index
                                  );
                                }
                              }}
                            >
                              <img
                                src={src}
                                alt={`Memory ${
                                  index + 1
                                }`}
                                style={{
                                  opacity:
                                    (p.imageOpacity ??
                                      100) / 100,
                                  objectFit: "contain",
                                  objectPosition: `${p.imageAdjustments?.[String(index)]?.x ?? 50}% ${p.imageAdjustments?.[String(index)]?.y ?? 50}%`,
                                  transform: `scale(${(p.imageAdjustments?.[String(index)]?.scale ?? 100) / 100})`,
                                }}
                              />

                              {!isScattered && (
                                <span className="galleryPhotoHint">
                                  View
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Restore button */}
                  {p.galleryLayout ===
                    "scattered" &&
                    dustedPhotos.length >
                      0 && (
                      <button
                        type="button"
                        className="publicButton secondary restoreMemories"
                        onClick={() =>
                          setDustedPhotos([])
                        }
                      >
                        ↻ Restore memories
                      </button>
                    )}
                </>
              ) : (
                <p className="galleryHint">
                  This memory gallery is
                  waiting for its photos.
                </p>
              )}
            </>
          ) : p.type === "reasons" ? (
            <>
              {/* =================================================
                  REASONS
                 ================================================= */}

              <div className="publicEmoji">
                {p.emoji}
              </div>

              <div className="eyebrow">
                {p.subtitle}
              </div>

              <h1
                style={{
                  fontSize: p.headingSize,
                  color: p.headingColor,
                }}
              >
                {p.heading}
              </h1>

              <p>{p.text}</p>

              <div className="publicReasons">
                {(p.items ?? []).map(
                  (reason) => (
                    <article
                      key={reason.id}
                    >
                      <span>
                        {reason.emoji}
                      </span>

                      <h3>
                        {reason.title}
                      </h3>

                      <p>
                        {reason.text}
                      </p>
                    </article>
                  )
                )}
              </div>
            </>
          ) : p.type === "letter" ? (
            <>
              <div className="publicEmoji">{p.emoji}</div>
              <div className="eyebrow">{p.subtitle}</div>
              <h1 style={{fontSize:p.headingSize,color:p.headingColor}}>{p.heading}</h1>
              <article className="publicLetter" style={{color:p.letterColor ?? "#2d2024",fontSize:p.letterSize ?? p.bodySize ?? 17,lineHeight:p.letterLineHeight ?? p.lineHeight ?? 1.8,textAlign:p.letterAlign ?? "left",fontFamily:getFont(p.bodyFont || p.font)}}><h2 style={{fontFamily:getFont(p.headingFont || p.font),color:p.headingColor}}>{p.heading}</h2><p>{p.text}</p></article>
            </>
          ) : p.type === "secret" ? (
            <>
              {/* =================================================
                  SECRET / REVEAL
                 ================================================= */}

              <div className="publicEmoji">
                {p.emoji}
              </div>

              <h1
                style={{
                  fontSize: p.headingSize,
                  color: p.headingColor,
                }}
              >
                {p.heading}
              </h1>

              {!secret ? (
                <>
                  <p>{p.text}</p>

                  <button
                    type="button"
                    className="publicButton"
                    onClick={() =>
                      setSecret(true)
                    }
                  >
                    Tap to reveal{" "}
                    <span>♥</span>
                  </button>
                </>
              ) : (
                <div className="secretReveal">
                  <span>✦</span>

                  <h2>{p.text}</h2>

                  <button
                    type="button"
                    className="publicButton secondary"
                    onClick={() =>
                      setSecret(false)
                    }
                  >
                    Hide
                  </button>
                </div>
              )}
            </>
          ) : p.type === "cake" ? (
            <>
              {/* =================================================
                  CAKE
                 ================================================= */}

              <div className="eyebrow">
                {p.subtitle}
              </div>

              <h1
                style={{
                  fontSize: p.headingSize,
                  color: p.headingColor,
                }}
              >
                {p.heading}
              </h1>

              <div className="cakeGraphic">
                <div className="cakePlate" />

                <div className="cakeBody">
                  <div className="cakeTop" />
                  <div className="cakeCream" />
                </div>

                <div className="candles">
                  {candles.map(
                    (off, index) => (
                      <span
                        className="candleWrap"
                        key={index}
                      >
                        {/* Flame */}
                        <span
                          className={`flame ${
                            off
                              ? "flameOff"
                              : ""
                          }`}
                        />

                        {/* Smoke */}
                        {smoke.includes(
                          index
                        ) && (
                          <span className="smokePuff" />
                        )}

                        {/* Candle itself */}
                        <button
                          type="button"
                          aria-label={`Blow candle ${
                            index + 1
                          }`}
                          className={`candleStick ${
                            off ? "off" : ""
                          }`}
                          onClick={blow}
                        />
                      </span>
                    )
                  )}
                </div>
              </div>

              <p>{p.text}</p>

              <button
                type="button"
                className="publicButton"
                onClick={blow}
              >
                Blow a candle
              </button>
            </>
          ) : (
            <>
              {/* =================================================
                  NORMAL PAGE
                 ================================================= */}

              <div className="publicEmoji">
                {p.emoji}
              </div>

              <div className="eyebrow">
                {p.subtitle}
              </div>

              <h1
                style={{
                  fontSize: p.headingSize,
                  color: p.headingColor,
                }}
              >
                {p.heading}
              </h1>

              <p>{p.text}</p>

              {p.image && (
                <img
                  className="publicPhoto"
                  src={p.image}
                  alt={
                    p.title ||
                    "Memory"
                  }
                  style={{
                    opacity:
                      (p.imageOpacity ??
                        100) / 100,
                  }}
                />
              )}
            </>
          )}

          {/* =====================================================
              NAVIGATION
             ===================================================== */}

          {p?.memoryVideo && <video className="publicMemoryVideo" src={p.memoryVideo} controls playsInline preload="metadata" />}

          {p && (
            <div className="publicNav">
              <button
                type="button"
                className="publicButton secondary"
                disabled={i === 0}
                onClick={() =>
                  setI((x) =>
                    Math.max(0, x - 1)
                  )
                }
              >
                <ArrowLeft size={15} />
                Back
              </button>

              {i <
              pages.length - 1 ? (
                <button
                  type="button"
                  className="publicButton"
                  onClick={next}
                >
                  Keep going
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  className="publicButton"
                  onClick={() => {
                    setI(0);
                    setSecret(false);
                    setDustedPhotos([]);
                    setCandles([
                      false,
                      false,
                      false,
                    ]);
                  }}
                >
                  Replay
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          AUDIO PLAYER
         ========================================================= */}

      {audio && (
        <div className="publicAudio">
          <button
            type="button"
            aria-label={
              playing
                ? "Pause music"
                : "Play music"
            }
            onClick={() => {
              const audioElement = audioRef.current;
              if (!audioElement) return;
              if (audioElement.paused) {
                attemptAudioPlayback();
              } else {
                audioElement.pause();
                setPlaying(false);
              }
            }}
          >
            {playing ? (
              <Pause size={15} />
            ) : (
              <Play size={15} />
            )}
          </button>

          <Volume2 size={15} />

          <span>
            {audioName ||
              "Your song"}
          </span>

          <audio
            id="hanora-audio"
            src={audio}
            ref={audioRef}
            loop
            onCanPlay={() => setAudioError("")}
            onError={() => setAudioError("Uploaded audio could not be played. Please try another MP3 file.")}
            onPlay={() =>
              setPlaying(true)
            }
            onPause={() =>
              setPlaying(false)
            }
          />
          {audioError && <small className="publicAudioError">{audioError}</small>}
        </div>
      )}

      {/* =========================================================
          FOOTER
         ========================================================= */}

      <footer>
        Made as a private moment.
        <span>♥</span>
      </footer>
    </main>
  );
}