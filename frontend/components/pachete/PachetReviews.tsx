import { TestimonialCard, type Testimonial } from "@/components/meditatii/StudentTestimonials";
import type { CourseReview } from "@/lib/course-reviews";

const VISIBLE_REVIEWS = 6;

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-label={`${rating} din 5 stele`} className="text-amber-500">
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

function ReviewCard({ review }: { review: CourseReview }) {
  return (
    <article className="flex h-full flex-col rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 shadow-[0_16px_40px_-28px_rgba(2,132,199,0.4)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black leading-tight text-sky-950">{review.author}</p>
          {review.date ? <p className="mt-0.5 text-xs text-slate-500">{review.date}</p> : null}
        </div>
        <Stars rating={review.rating} />
      </div>
      {review.title ? <p className="mt-3 font-bold text-slate-800">{review.title}</p> : null}
      <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-700">{review.content}</p>
    </article>
  );
}

type Props = {
  courseName: string;
  reviews: CourseReview[];
};

/** Dovada sociala pe paginile /pachete, inainte de preturi: review-urile cursului. */
export function PachetReviews({ courseName, reviews }: Props) {
  if (reviews.length === 0) return null;
  const average = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const visible = reviews.slice(0, VISIBLE_REVIEWS);
  const hidden = reviews.slice(VISIBLE_REVIEWS);

  return (
    <section aria-labelledby="recenzii-heading" className="mx-auto w-full max-w-[1280px] px-4 pb-6 pt-8 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Ce spun elevii</p>
        <h2 id="recenzii-heading" className="mt-1.5 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">
          Elevi care s-au pregătit cu Paul
        </h2>
        <p className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-1.5 text-sm font-semibold text-slate-800">
          <Stars rating={average} />
          <span>
            {average.toFixed(1).replace(".", ",")} din 5 · {reviews.length} review-uri la {courseName}
          </span>
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((review) => (
          <ReviewCard key={`${review.author}-${review.title}`} review={review} />
        ))}
      </div>
      {hidden.length > 0 ? (
        <details className="group mt-5">
          <summary className="mx-auto flex w-fit cursor-pointer list-none rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-50">
            <span className="group-open:hidden">Vezi toate cele {reviews.length} review-uri</span>
            <span className="hidden group-open:inline">Ascunde review-urile</span>
          </summary>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hidden.map((review) => (
              <ReviewCard key={`${review.author}-${review.title}`} review={review} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

type TestimonialsProps = {
  testimonials: Testimonial[];
  heading: string;
};

/** A doua zona de dovada sociala, dupa testul gratuit: elevi admisi dupa meditatiile cu Paul. */
export function PachetTestimonials({ testimonials, heading }: TestimonialsProps) {
  if (testimonials.length === 0) return null;
  return (
    <section aria-labelledby="testimoniale-heading" className="mx-auto w-full max-w-[1280px] px-4 pb-10 sm:px-6">
      <div className="text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Rezultate</p>
        <h2 id="testimoniale-heading" className="mt-1.5 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-2 text-sm text-slate-600">Recenzii reale ale elevilor de la meditațiile cu Paul.</p>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
        ))}
      </div>
    </section>
  );
}
