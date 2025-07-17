import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-equestrian.jpg";
import equiLogo from "@/assets/equi-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import mobHeroImage from "@/assets/mob_land.png";


const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleJoinWaitlist = () => {
    navigate('/waitlist');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleEnterApp = () => {
    navigate('/experts');
  };

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top Bar */}
      <header className="w-full flex items-center justify-between px-5 py-3 bg-white">
        {/* Logo */}
        <div className="flex items-center space-x-1.5">
          <img src={equiLogo} alt="EquiEdge Logo" className="w-7 h-7 object-contain" />
          <span className="text-[1.01rem] font-normal tracking-tight text-gray-900 select-none">
            <span className="font-semibold">Equi</span><span className="font-extrabold ml-0.45">Edge</span>
          </span>
        </div>
        {/* Right side */}
        <div className="flex items-center space-x-2">
          <button className="flex items-center text-xs font-semibold tracking-wide text-gray-900 uppercase hover:underline focus:outline-none px-1" onClick={handleJoinWaitlist}>
            JOIN
            <span className="ml-1 text-xl font-extrabold align-middle" style={{fontFamily: 'monospace', fontWeight: 900, lineHeight: 1, display: 'inline-block'}}>&#8250;</span>
          </button>
          {isAuthenticated ? (
            <Button onClick={handleEnterApp} variant="hero" size="sm" className="rounded-none px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-none min-w-[36px] min-h-[24px]">
              Enter App
            </Button>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[0.62rem] font-bold px-4 py-0.5 min-w-[32px] min-h-[22px] focus:outline-none border-none rounded-none"
            >
              LOG IN
            </button>
          )}
          {/* Menu button */}
          <button className="ml-1 p-1 w-8 h-8 flex items-center justify-center border-none bg-transparent hover:bg-gray-100 focus:outline-none">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <rect y="5" width="20" height="2" rx="1" fill="#222" />
              <rect y="10.5" width="20" height="2" rx="1" fill="#222" />
              <rect y="16" width="20" height="2" rx="1" fill="#222" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="w-full bg-white"
        style={{
          height: isMobile ? 'auto' : '76vh',
          minHeight: isMobile ? undefined : 430,
          maxHeight: 3050,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <img
            src={isMobile ? mobHeroImage : heroImage}
            alt="Equestrian Hero"
            style={{
              width: isMobile ? '100vw' : '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'left top',
              background: 'white',
              display: 'block',
              left: isMobile ? '50%' : undefined,
              position: isMobile ? 'relative' : undefined,
              transform: isMobile ? 'translateX(-50%)' : undefined,
            }}
          />
          {isMobile ? (
            <div
              className="flex flex-col items-center justify-center text-center w-full px-4"
              style={{
                position: 'absolute',
                top: '3%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '100vw',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <div style={{background: 'rgba(0,0,0,0.3)', borderRadius: '1.1rem', padding: '1.0rem 1.0rem 1.0rem 1.0rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <h1 className="text-3xl sm:text-4xl font-bold uppercase text-white leading-tight mb-2 tracking-tight text-center" style={{letterSpacing: '-0.06em', lineHeight: '1.16'}}>
                  BOOK 1:1 COACHING<br />
                  WITH THE EQUESTRIAN<br />
                  WORLD'S TOP EXPERTS
                </h1>
                <button
                  onClick={handleJoinWaitlist}
                  className="mt-2 rounded-full px-7 py-3 text-xs md:px-6 md:py-3 md:text-xs lg:px-9 lg:py-3 lg:text-base font-semibold bg-black border border-white text-white shadow-lg hover:bg-white/30 transition-all flex items-center backdrop-blur-sm"
                  style={{boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)'}}
                >
                  Join Waitlist
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-end justify-center text-right"
              style={{
                position: 'absolute',
                top: '50%',
                right: '5%',
                transform: 'translateY(-50%)',
                maxWidth: '36vw',
              }}
            >
              <h1 className="text-[1.7rem] sm:text-2xl md:text-4xl lg:text-5xl font-bold uppercase text-gray-900 leading-[1.08] mb-4 tracking-tight" style={{letterSpacing: '-0.07em', lineHeight: '1.16', textAlign: 'right'}}>
                BOOK 1:1<br />
                COACHING WITH<br />
                THE EQUESTRIAN<br />
                WORLD'S TOP<br />
                EXPERTS
              </h1>
              <button
                onClick={handleJoinWaitlist}
                className="mt-2 rounded-full px-5 py-2 text-xs md:px-6 md:py-3 md:text-xs lg:px-9 lg:py-3 lg:text-base font-small bg-white border border-gray-200 text-[#333] shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] hover:bg-gray-50 transition-all flex items-center"
              >
                Join Waitlist
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Summary Section */}
      <section className="px-6 md:px-12 pt-16 pb-20 md:pt-15">
        <div className="max-w-6xl mx-auto md:grid md:grid-cols-[220px_1fr] md:gap-x-4">
          <div className="flex flex-col">
            <h2 className="text-4xl md:text-4xl font-semibold text-gray-900 mb-2 tracking-tight text-center md:text-left md:mb-0">SUMMARY</h2>
            <div className="hidden md:block mt-6">
              <div className="flex flex-col items-center justify-center border border-gray-200 rounded-xl p-1 bg-white w-36 min-h-[80px]" style={{marginTop: '0.25rem'}}>
                <div className="mb-1">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff"/><path d="M7.5 10.5a4.5 4.5 0 1 1 9 0c0 2.485-2.015 4.5-4.5 4.5a4.5 4.5 0 0 1-4.5-4.5Zm4.5 6.75a6.75 6.75 0 0 1-6.75-6.75a6.75 6.75 0 1 1 13.5 0a6.75 6.75 0 0 1-6.75 6.75Z" fill="#B6FF3A"/></svg>
                </div>
                <div className="text-base font-medium text-gray-800 mb-1">Questions?</div>
                <a href="/contact" className="text-[#B6FF3A] font-bold underline text-sm flex items-center gap-1 hover:text-lime-500 transition-colors">
                  Contact us
                  <svg width="10" height="14" fill="none" viewBox="0 0 24 24"><path d="M5 12h14m-7-7l7 7-7 7" stroke="#B6FF3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mt-0 md:mt-0 sm:mt-8">
            <Card className="border-0 md:border shadow-none md:shadow">
              <CardContent className="px-0 md:px-5 py-5 flex flex-col items-start text-left w-full">
                <h3 className="text-base md:text-base font-medium mb-3 text-gray-900 text-left w-full">
                  A PROVEN PATH TO SUCCESS
                </h3>
                <p className="text-black text-sm md:text-sm text-left w-full">
                World-class equestrians, top entrepreneurs and even Nobel Prize winners share one thing in common: they were mentored by one--or often several--top performers.  They learned from those whose methods consistently delivered exceptional results.  EquiEdge offers that same advantage--through 1:1 coaching with elite experts, anytime, anywhere. It's the shortcut used by the best--and now, it's available to you.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 md:border shadow-none md:shadow">
              <CardContent className="px-0 md:px-5 py-5 flex flex-col items-start text-left w-full">
                <h3 className="text-base md:text-base font-medium mb-3 text-gray-900 text-left w-full">
                  THE EDGE IS WHAT YOU KNOW
                </h3>
                <p className="text-black text-sm md:text-sm text-left w-full">
                When you tap into experts with different backgrounds, you gain insights you might otherwise miss. Their guidance helps you counter blind spots, avoid missteps, uncover hidden opportunities, and improve decisions and outcomes.  That's why elite performers in every field--from business to science to sport--prioritize access to great minds. Because in the end, better knowledge leads to better outcomes.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 md:border shadow-none md:shadow">
              <CardContent className="px-0 md:px-5 py-5 flex flex-col items-start text-left w-full">
                <h3 className="text-base md:text-base font-medium mb-3 text-gray-900 text-left w-full">
                  GUIDANCE FROM TOP EXPERTS
                </h3>
                <p className="text-black text-sm md:text-sm text-left w-full">
                Whether you're goal is to sharpen your riding, bring the best out in your horse, work with a top mind coach, make high-stakes decisions with confidence, build a thriving equestrian business, get a second opinion from a leading vet or rider, or gain the kind of mentorship that drives long-term success--EquiEdge connects you with the experts who can help you get there, faster and smarter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-50 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">E</span>
          </div>
          <span className="text-lg font-bold text-gray-900">EquiEdge</span>
        </div>
        <p className="text-gray-500 text-sm">
          © 2024 EquiEdge. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Landing;