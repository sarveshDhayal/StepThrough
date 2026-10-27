import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export interface QuestionAnswer {
  question: string;
  answer: string;
}

interface LearnSectionProps {
  title: string;
  theory: string;
  questions: QuestionAnswer[];
}

export const LearnSection: React.FC<LearnSectionProps> = ({
  title,
  theory,
  questions,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Learn: {title}
        </h2>
      </div>

      <div className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
        {theory}
      </div>

      <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-3">
        Common Interview Questions
      </h3>

      <div className="space-y-3">
        {questions.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(idx)}
                className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                <span>{item.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

