import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import ChatMockup from "@/components/landing/ChatMockup";
import Security from "@/components/landing/Security";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <ChatMockup />
        <Security />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
