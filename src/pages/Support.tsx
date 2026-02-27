import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, Clock, ChevronDown, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
  category: 'account' | 'gameplay' | 'wallet' | 'general';
}

const faqs: FAQItem[] = [
  {
    category: 'account',
    question: 'How do I create an account?',
    answer: 'Click the "Register" button at the top right of the page. Fill in your email, username, and password. Verify your email address and you\'re all set! You\'ll start with 1000 Coins to explore games.'
  },
  {
    category: 'account',
    question: 'I forgot my password. How can I reset it?',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.'
  },
  {
    category: 'account',
    question: 'How do I verify my account with KYC?',
    answer: 'Go to your Profile page and click on the KYC Verification section. Submit the required documents (ID, proof of address). Our team will review your submission within 24-48 hours.'
  },
  {
    category: 'gameplay',
    question: 'How does the RTP system work?',
    answer: 'RTP (Return to Player) is the percentage of bets that is returned to players over time. Each game has a specific RTP (e.g., 95%). This means over millions of plays, players get back approximately 95% of wagered coins.'
  },
  {
    category: 'gameplay',
    question: 'Can I play games for free?',
    answer: 'Yes! Every new player starts with 1000 Coin Chips (GC) free. You can play all games with these coins. GC can only be used for gameplay, while SC (Server Coins) is our premium currency for redemptions.'
  },
  {
    category: 'gameplay',
    question: 'What\'s the difference between GC and SC?',
    answer: 'GC (Game Coins) is for gameplay only. SC (Server Coins) is our premium currency that can be redeemed for real money or prizes. SC is earned by winning games, bonuses, or tournaments.'
  },
  {
    category: 'wallet',
    question: 'How do I purchase coins?',
    answer: 'Go to the Wallet page and select the coin package you want to buy. Choose your payment method (Stripe), complete the payment, and coins will be added to your account instantly.'
  },
  {
    category: 'wallet',
    question: 'What are the redemption requirements?',
    answer: 'You must have a verified KYC status to redeem SC for cash. Minimum redemption is 100 SC. There\'s a $5 service fee per redemption. Payouts are processed within 5-7 business days.'
  },
  {
    category: 'wallet',
    question: 'How long does a withdrawal take?',
    answer: 'Once approved, withdrawals are processed within 5-7 business days depending on your bank. CashApp and bank transfers are available redemption methods.'
  },
  {
    category: 'general',
    question: 'Is CoinKrazy Gaming legit and safe?',
    answer: 'Yes! CoinKrazy Gaming operates under strict compliance with gaming regulations. All data is encrypted, and we use industry-standard security practices. Your account and transactions are fully protected.'
  },
  {
    category: 'general',
    question: 'How do bonuses and promotions work?',
    answer: 'Check the Bonuses section to see available offers. Bonuses have specific wagering requirements (e.g., 10x wagering) before you can cash out. Once you meet the requirements, the bonus coins are added to your balance.'
  },
  {
    category: 'general',
    question: 'Can I participate in tournaments?',
    answer: 'Absolutely! Visit the Tournaments page to see active tournaments. Entry is usually free or low-cost. Compete with other players to win SC prizes. Leaderboards update in real-time.'
  }
];

export default function Support() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'account' | 'gameplay' | 'wallet' | 'general'>('all');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'account', label: 'Account' },
    { id: 'gameplay', label: 'Gameplay' },
    { id: 'wallet', label: 'Wallet & Payments' },
    { id: 'general', label: 'General' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setContactStatus(null);

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json();

      if (response.ok) {
        setContactStatus({ type: 'success', message: 'Message sent! Our support team will be in touch within 24 hours.' });
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setContactStatus({ type: 'error', message: data.error || 'Failed to send message' });
      }
    } catch (error) {
      setContactStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-black text-white">We're Here to Help</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Have questions? Check our FAQ below or contact our support team directly.
          </p>
        </motion.div>

        {/* Support Options */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-blue-500/30 hover:border-blue-500/50 transition-all">
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto border border-blue-500/30">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Email Support</h3>
              <p className="text-slate-400 text-sm">support@coincrazy.com</p>
              <p className="text-slate-500 text-xs">Response within 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border-emerald-500/30 hover:border-emerald-500/50 transition-all">
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto border border-emerald-500/30">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Live Chat</h3>
              <p className="text-slate-400 text-sm">Mon-Fri 9AM-6PM EST</p>
              <p className="text-slate-500 text-xs">Click the chat icon in the app</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-purple-500/30 hover:border-purple-500/50 transition-all">
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto border border-purple-500/30">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-lg">Status Page</h3>
              <p className="text-slate-400 text-sm">status.coincrazy.com</p>
              <p className="text-slate-500 text-xs">Real-time system status</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="border-b border-slate-800">
              <h2 className="text-2xl font-bold text-white">Send us a Message</h2>
              <p className="text-slate-400 text-sm mt-1">We'll get back to you as soon as possible</p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Full Name</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Email Address</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Subject</label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    <option value="">Select a subject...</option>
                    <option value="account">Account Issue</option>
                    <option value="gameplay">Gameplay Problem</option>
                    <option value="payment">Payment Issue</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                    placeholder="Describe your issue or question..."
                  />
                </div>

                <AnimatePresence>
                  {contactStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl flex items-center gap-3 ${
                        contactStatus.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {contactStatus.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 shrink-0" />
                      )}
                      <p className="text-sm">{contactStatus.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-3 mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No FAQs found for this category</p>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      className="w-full text-left"
                    >
                      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                        <CardContent className="p-6 flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">{faq.question}</h3>
                          <ChevronDown 
                            className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ml-4 ${
                              expandedFAQ === index ? 'rotate-180' : ''
                            }`}
                          />
                        </CardContent>
                      </Card>
                    </button>

                    <AnimatePresence>
                      {expandedFAQ === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2"
                        >
                          <Card className="bg-slate-950/50 border-slate-800">
                            <CardContent className="p-6 text-slate-300 leading-relaxed">
                              {faq.answer}
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-3xl p-8 text-center"
        >
          <h3 className="text-xl font-bold text-white mb-2">Didn't find an answer?</h3>
          <p className="text-slate-400 mb-6">Our support team is ready to help. Send us a message above or email us directly at support@coincrazy.com</p>
          <p className="text-sm text-slate-500">Average response time: <span className="text-emerald-400 font-bold">Less than 2 hours</span></p>
        </motion.div>
      </div>
    </div>
  );
}
