import Link from "next/link";
import { FeedbackForms } from "@/components/feedback-forms";
import { MenuBrowser } from "@/components/menu-browser";
import { listMenu, listReviews } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [items, reviews] = await Promise.all([listMenu(), listReviews()]);
  return (
    <main id="main">
      <section className="hero section-shell">
        <div className="hero-copy">
          <span className="eyebrow">Food that keeps its edge</span>
          <h1>
            Good food.
            <br />
            <em>Gone places.</em>
          </h1>
          <p>
            Chef-built plates, packed at their peak and moving your way. No theatre. No shortcuts.
            Just a better night in.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="#menu">
              Order tonight
            </Link>
            <Link className="button ghost" href="/track">
              Track an order <span>↗</span>
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <strong>4.8</strong> average rating
            </span>
            <span>
              <strong>28 min</strong> median delivery
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit">Fresh / Fast / Precise /</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/bg.jpg" alt="Tomato penne with fresh rocket" />
          <div className="hero-ticket">
            <span>Tonight&apos;s signal</span>
            <strong>Wild Tomato Penne</strong>
            <small>bright · peppery · clean</small>
          </div>
        </div>
      </section>

      <section className="metric-strip" aria-label="Restaurant metrics">
        <div>
          <strong>12k+</strong>
          <span>plates sent</span>
        </div>
        <div>
          <strong>4.8/5</strong>
          <span>guest rating</span>
        </div>
        <div>
          <strong>94%</strong>
          <span>on-time arrival</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>made to order</span>
        </div>
      </section>

      <section className="statement section-shell">
        <span className="eyebrow">The Food.Go experience</span>
        <p>
          Restaurant thinking, without the restaurant wait. We build every order around{" "}
          <em>contrast, temperature and travel</em>—so the last bite lands like the first.
        </p>
      </section>

      <section className="menu-section section-shell" id="menu">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Built for right now</span>
            <h2>Choose your signal.</h2>
          </div>
          <p>
            Seasonal produce, bold flavour and travel-smart finishing. Search, filter, inspect, then
            make it yours.
          </p>
        </div>
        {items.length ? (
          <MenuBrowser items={items} />
        ) : (
          <div className="empty-state">
            <p>The kitchen is refreshing today&apos;s menu. Please check back shortly.</p>
          </div>
        )}
      </section>

      <section className="benefit-section section-shell">
        <div className="benefit-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/menu4.jpg" alt="Bright seasonal salad" />
          <span>Prepared to travel</span>
        </div>
        <div className="benefit-copy">
          <span className="eyebrow">Why it arrives better</span>
          <h2>The distance is part of the recipe.</h2>
          <div className="benefit-list">
            <article>
              <span>01</span>
              <div>
                <h3>Travel-smart plates</h3>
                <p>Sauces, textures and finishing touches are packed to arrive in balance.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Real kitchen timing</h3>
                <p>
                  Preparation starts only when the kitchen can protect quality through dispatch.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Clear from cart to door</h3>
                <p>
                  Know the full total before checkout and follow every meaningful status change.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="steps section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Three clean moves</span>
            <h2>From craving to door.</h2>
          </div>
        </div>
        <div className="step-grid">
          <article>
            <span>01</span>
            <h3>Find your plate</h3>
            <p>Filter by mood, category or dietary need. Every detail is upfront.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Set the table</h3>
            <p>Adjust your cart, confirm delivery details, then choose COD or UPI on delivery.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Follow the heat</h3>
            <p>Use your private order ID and phone to track the kitchen-to-door timeline.</p>
          </article>
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/expert3.jpg" alt="Food.Go chef at work" />
        </div>
        <div className="story-copy">
          <span className="eyebrow">Inside the kitchen</span>
          <h2>
            Technique first.
            <br />
            Ego nowhere.
          </h2>
          <p>
            Our cooks design each dish for the moment you open it—not the moment it leaves the pass.
            That changes everything: the cut, the heat, the finish and the packaging.
          </p>
          <blockquote>
            “Delivery food should not feel like a compromise. It should feel like a format of its
            own.”
          </blockquote>
          <span className="signature">— The Food.Go kitchen</span>
        </div>
      </section>

      <section className="reviews-section section-shell">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Notes from the table</span>
            <h2>Still talking after the last bite.</h2>
          </div>
        </div>
        <div className="review-grid">
          {reviews.slice(0, 3).map((review) => (
            <article key={review.id}>
              <span>{"★".repeat(review.rating)}</span>
              <blockquote>“{review.body}”</blockquote>
              <strong>{review.authorName}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="support-section section-shell" id="support">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Keep the loop open</span>
            <h2>Tell us what landed.</h2>
          </div>
          <p>
            Share a review or reach the people behind the pass. Both go straight into Food.Go
            operations.
          </p>
        </div>
        <FeedbackForms />
      </section>

      <section className="final-cta">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/bg2.jpg" alt="A Food.Go table filled with fresh dishes" />
        </div>
        <div>
          <span className="eyebrow">Tonight is still open</span>
          <h2>
            Make dinner
            <br />
            the easy decision.
          </h2>
          <Link className="button primary" href="#menu">
            Explore the menu
          </Link>
        </div>
      </section>
    </main>
  );
}
