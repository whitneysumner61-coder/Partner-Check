import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { AlignmentAnalysis, AlignmentStatus, PreNupData } from '../types';
import { PRENUP_QUESTIONS } from '../constants';
import { Button } from './ui/Button';

interface Props {
  results: AlignmentAnalysis[];
  data: PreNupData;
  onReset: () => void;
}

const D3Heatmap: React.FC<{ results: AlignmentAnalysis[] }> = ({ results }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 60;
    const padding = 5;
    const itemWidth = (width - (padding * (results.length - 1))) / results.length;

    results.forEach((r, i) => {
      let color = '#d1d5db'; // gray
      if (r.status === AlignmentStatus.HIGH) color = '#22c55e';
      if (r.status === AlignmentStatus.MEDIUM) color = '#eab308';
      if (r.status === AlignmentStatus.LOW) color = '#ef4444';

      // Bar
      svg.append("rect")
        .attr("x", i * (itemWidth + padding))
        .attr("y", 0)
        .attr("width", itemWidth)
        .attr("height", height)
        .attr("rx", 4)
        .attr("fill", color)
        .attr("opacity", 0.8);

      // Label
      svg.append("text")
        .attr("x", i * (itemWidth + padding) + itemWidth / 2)
        .attr("y", height / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(i + 1);
    });

  }, [results]);

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Conflict Heatmap</h4>
      <svg ref={svgRef} width={300} height={60} />
    </div>
  );
};

export const PreNupResults: React.FC<Props> = ({ results, data, onReset }) => {
  const overallScore = Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length);
  
  // Prepare chart data
  const chartData = results.map((r, i) => ({
    subject: `Q${i + 1}`,
    score: r.score,
    fullMark: 100
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Alignment Report</h2>
          <p className="text-slate-600">Analysis for {data.partnerA.name} & {data.partnerB.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-400 uppercase">Overall Alignment</div>
          <div className={`text-4xl font-black ${overallScore > 75 ? 'text-green-500' : overallScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            {overallScore}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Visuals */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
           <h3 className="text-lg font-bold text-slate-700 mb-4">Alignment Radar</h3>
           <div className="w-full h-64">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                 <PolarGrid />
                 <PolarAngleAxis dataKey="subject" />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} />
                 <Radar name="Alignment" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                 <Tooltip />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Heatmap & Key */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center gap-8">
          <D3Heatmap results={results} />
          
          <div className="space-y-3 px-8">
             <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-alert-green mr-3"></div>
                <span className="text-sm text-slate-600">High Alignment (Discuss briefly)</span>
             </div>
             <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-alert-yellow mr-3"></div>
                <span className="text-sm text-slate-600">Medium (Needs conversation)</span>
             </div>
             <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-alert-red mr-3"></div>
                <span className="text-sm font-bold text-slate-800">Critical Conflict (STOP)</span>
             </div>
          </div>
        </div>

        {/* Action Item */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-sm text-white flex flex-col justify-center text-center border-l-8 border-primary">
           <h3 className="text-xl font-bold mb-4">PartnerCheck Recommendation</h3>
           {overallScore > 80 ? (
             <p className="text-lg">You are <span className="text-green-400 font-bold">well aligned</span>. Proceed to legal drafting, but you <span className="underline decoration-yellow-500 decoration-4">MUST discuss the yellow items live</span> before signing.</p>
           ) : overallScore > 60 ? (
             <p className="text-lg">Caution. <span className="text-yellow-400 font-bold">Operational differences detected.</span> Do not sign yet. Schedule a "hard questions" dinner to resolve the <span className="text-yellow-400 font-bold">Medium</span> and <span className="text-red-400 font-bold">Low</span> alignment areas.</p>
           ) : (
             <p className="text-lg font-bold text-red-400">STOP. Fundamental misalignment detected. This partnership has a high probability of failure. Do not proceed without a complete reset or finding a new partner.</p>
           )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Detailed Analysis</h3>
        {results.map((r, i) => {
           const question = PRENUP_QUESTIONS[i];
           if (!question) return null;
           const qId = question.id;
           return (
             <div key={i} className={`rounded-lg border-l-4 overflow-hidden shadow-sm bg-white
               ${r.status === 'LOW' ? 'border-red-500' : r.status === 'MEDIUM' ? 'border-yellow-400' : 'border-green-500'}
             `}>
               <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-slate-800 text-lg">{i+1}. {question.text}</h4>
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase
                       ${r.status === 'LOW' ? 'bg-red-100 text-red-800' : r.status === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                    `}>{r.status} Alignment</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded">
                      <span className="block text-xs font-bold text-slate-400 uppercase mb-1">{data.partnerA.name}</span>
                      {data.partnerA.answers[qId]}
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <span className="block text-xs font-bold text-slate-400 uppercase mb-1">{data.partnerB.name}</span>
                      {data.partnerB.answers[qId]}
                    </div>
                 </div>

                 <div className="bg-slate-900 text-slate-200 p-4 rounded text-sm flex gap-3">
                   <span className="text-xl">🤖</span>
                   <p>{r.summary}</p>
                 </div>
               </div>
             </div>
           );
        })}
      </div>

      <div className="mt-12 text-center pb-20">
        <Button onClick={onReset} variant="secondary">Start New Analysis</Button>
      </div>
    </div>
  );
};