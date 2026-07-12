import { useState } from 'react';
import { Target, Award, CheckCircle, AlertTriangle, PlayCircle, X, Check } from 'lucide-react';

const ShieldTrain = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Which of the following is a strong indicator of a Deepfake video?",
      options: [
        "The video is in 4K resolution.",
        "The speaker is discussing financial returns.",
        "The lip-syncing appears slightly delayed or blurred around the mouth.",
        "The video is hosted on YouTube."
      ],
      answerIndex: 2
    },
    {
      question: "If you receive an urgent SMS claiming your demat account will be blocked unless you click a link, you should:",
      options: [
        "Click the link immediately to prevent the block.",
        "Forward the link to your broker's official support email or use SEBI Kavach to verify it.",
        "Reply to the SMS with your PAN details.",
        "Ignore it, but click the link later if the account actually stops working."
      ],
      answerIndex: 1
    }
  ];

  const handleAnswer = (index: number) => {
    if (index === quizQuestions[quizStep].answerIndex) {
      setQuizScore(prev => prev + 1);
    }
    setQuizStep(prev => prev + 1);
  };

  const resetQuiz = () => {
    setShowQuiz(false);
    setQuizStep(0);
    setQuizScore(0);
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">ShieldTrain</h2>
        <p className="text-foreground/60">Investor Immunity & Gamified Education Module</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-border" />
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.85" strokeDashoffset="70.37" className="text-green-500" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">80%</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg">Immunity Score</h3>
            <p className="text-sm text-foreground/60">You have successfully identified 4 out of 5 simulated phishing attacks this month.</p>
          </div>
          <button 
            onClick={() => setShowQuiz(true)}
            className="w-full bg-foreground text-background py-2 rounded-lg font-medium hover:bg-foreground/90 transition-colors"
          >
            Start Practice Quiz
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center"><Target className="mr-2" size={20}/> Recent Simulated Campaigns</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><CheckCircle size={20} /></div>
                  <div>
                    <p className="font-medium text-sm">Deepfake Voice Call</p>
                    <p className="text-xs text-foreground/60">July 10, 2026</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full">Passed (Didn't share OTP)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><AlertTriangle size={20} /></div>
                  <div>
                    <p className="font-medium text-sm">Fake SMS Alert</p>
                    <p className="text-xs text-foreground/60">June 28, 2026</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-red-500 bg-red-500/10 px-3 py-1 rounded-full">Failed (Clicked Link)</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 relative overflow-hidden">
            <Award className="absolute -right-4 -bottom-4 text-yellow-500/20 w-32 h-32" />
            <h3 className="font-bold text-lg mb-2 text-yellow-600 dark:text-yellow-500">Micro-learning Moment</h3>
            <p className="text-sm text-foreground/80 mb-4 max-w-md">Because you clicked the simulated SMS link last week, we prepared a 30-second video on how to spot fake domains.</p>
            <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center hover:bg-yellow-400 transition-colors">
              <PlayCircle className="mr-2" size={18} /> Watch 30s Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={resetQuiz} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">
              <X size={20} />
            </button>
            
            {quizStep < quizQuestions.length ? (
              <div>
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Question {quizStep + 1} of {quizQuestions.length}</span>
                  <h3 className="text-lg font-bold mt-2">{quizQuestions[quizStep].question}</h3>
                </div>
                
                <div className="space-y-3">
                  {quizQuestions[quizStep].options.map((opt, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className="w-full text-left p-4 rounded-lg border border-border bg-background hover:border-foreground/50 hover:bg-background/50 transition-colors text-sm"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                <p className="text-foreground/70">You scored {quizScore} out of {quizQuestions.length}.</p>
                <button 
                  onClick={resetQuiz}
                  className="mt-4 px-6 py-2 bg-foreground text-background font-bold rounded-lg hover:bg-foreground/90"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShieldTrain;
