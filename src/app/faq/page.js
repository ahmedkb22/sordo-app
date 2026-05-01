'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import Footer from '../../components/footer'
import './faq.css'

const FAQS = [
  {
    q: 'What is Sordo?',
    a: 'Sordo is a real-time ASL (American Sign Language) detection web application. It uses your device\'s camera, MediaPipe hand tracking, and a deep learning model to recognize hand signs and translate them into text — all directly in your browser, with no backend required.'
  },
  {
    q: 'Do I need to install anything to use Sordo?',
    a: 'No installation needed. Sordo runs entirely in your browser. Just open the app, allow camera access, and start signing. The AI model loads automatically in the background.'
  },
  {
    q: 'Which ASL signs can Sordo currently detect?',
    a: 'Sordo currently recognizes 8 signs: "Hello", "Help", "My", "Name", "Yes", "No", "Ahmed", and "Abdessamed". We are actively training the model to support more signs and expand the vocabulary over time.'
  },
  {
    q: 'How does the detection work?',
    a: 'Sordo uses MediaPipe Hands to track 21 landmarks on each hand in real time. These landmarks are normalized and fed into a custom LSTM neural network trained on sequences of 30 frames. The model outputs the most likely sign with a confidence score.'
  },
  {
    q: 'Does Sordo send my camera feed to a server?',
    a: 'No. All processing happens locally on your device inside the browser. Your camera feed never leaves your machine — not to our servers or anywhere else. This means faster detection and full privacy.'
  },
  {
    q: 'Why is the detection sometimes slow or inaccurate?',
    a: 'Detection quality depends on lighting, hand position, camera quality, and your device\'s processing power. For best results, make sure your hand is clearly visible, well-lit, and facing the camera. Try to sign at a moderate pace and hold each sign for at least 1 second.'
  },
  {
    q: 'Can Sordo detect signs from both hands?',
    a: 'Yes. Sordo supports two-hand detection. The model assigns a slot for the right hand and one for the left hand, and combines their landmarks into a single 126-value input (2 hands × 21 landmarks × 3 axes) for each frame.'
  },
  {
    q: 'Is Sordo available on mobile?',
    a: 'Sordo is designed to work on modern browsers including mobile browsers. However, for the best experience we recommend using a desktop or laptop with a good front-facing camera, as mobile performance may vary depending on the device.'
  },
  {
    q: 'How do I improve my detection accuracy?',
    a: 'Use the Training section inside the app to practice signs and get familiar with how the model responds. Make sure your background is not too busy, your hand is in the center of the frame, and your lighting is even. Avoid fast movements between signs.'
  },
  {
    q: 'Who built Sordo and why?',
    a: 'Sordo was built by Kebir Ahmed and Bendella Abdessamed as a project aimed at making communication more accessible for the deaf and hard-of-hearing community. The name "Sordo" means "deaf" in Spanish and Italian — a nod to the people this tool is built for.'
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="faq-main">
      <Navbar />

      {/* Hero */}
      <section className="faq-hero">
        <div className="faq-hero-glow" />
        <div className="faq-badge">
          <span className="faq-badge-dot" />
          Help Center
        </div>
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-subtitle">
          Everything you need to know about Sordo, how it works, and how to get the most out of it.
        </p>
      </section>

      {/* FAQ items */}
      <section className="faq-section">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={`faq-item ${openIndex === i ? 'open' : ''}`}
          >
            <button
              className="faq-question"
              onClick={() => toggle(i)}
              aria-expanded={openIndex === i}
            >
              <span className="faq-question-text">{faq.q}</span>
              <span className="faq-icon">+</span>
            </button>
            <div className="faq-answer">
              <p className="faq-answer-inner">{faq.a}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <div className="faq-cta">
        <div className="faq-cta-box">
          <h3 className="faq-cta-title">Still have questions?</h3>
          <p className="faq-cta-desc">
            Can't find what you're looking for? Reach out to us directly and we'll get back to you.
          </p>
          <Link href="/contact" className="faq-cta-btn">
            Contact Us
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}