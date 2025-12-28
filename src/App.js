import React, { useState } from 'react';

// --- Main App Component ---
export default function App() {
  const [rollNo, setRollNo] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchResults = async (e) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      setError('Please enter a roll number.');
      return;
    }
    if (rollNo.trim().length !== 11 || !/^\d+$/.test(rollNo.trim())) {
      setError('Roll number must be exactly 11 digits.');
      return;
    }

    setLoading(true);
    setResultData(null);
    setError('');

    try {
      const response = await fetch(`http://127.0.0.1:8001/results/${rollNo}/all`);
      
      if (!response.ok) {
        let errorDetail = `HTTP error! Status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || 'An unknown error occurred.';
        } catch (jsonError) {
          errorDetail = response.statusText || 'Failed to get details from server.';
        }
        throw new Error(errorDetail);
      }
      
      const data = await response.json();
      setResultData(data);

    } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setResultData(null);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col items-center">
      <header className="w-full bg-white shadow-md p-4 sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-center text-indigo-600">
          ABC Institutions
        </h1>
        <p className="text-center text-gray-500 mt-1">Latest Semester Results Portal</p>
      </header>

      <main className="w-full max-w-5xl mx-auto p-4 md:p-8 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleFetchResults} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter 11-Digit Roll Number"
              className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              maxLength="11"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 disabled:bg-indigo-300"
            >
              {loading ? 'Searching...' : 'Get Latest Result'}
            </button>
          </form>
        </div>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-center" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        
        {resultData && <ResultDisplay data={resultData} />}
      </main>
    </div>
  );
}

// --- Component to Display the Result ---
const ResultDisplay = ({ data }) => {
  if (!data || !data.academic_history || data.academic_history.length === 0) return null;

  const { student_info, academic_history, cgpa } = data;
  
  // Show only the latest semester
  const latestSemester = [...academic_history].sort((a, b) => b.semester - a.semester)[0];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{student_info.name}</h2>
            <p className="text-md text-gray-500">Roll No: <span className="font-semibold text-indigo-600">{student_info.roll_no}</span></p>
        </div>
        {cgpa !== null && (
             <div className="bg-green-100 p-4 rounded-lg shadow-sm mt-4 md:mt-0 text-center">
                <p className="text-sm font-medium text-green-800">Overall CGPA</p>
                <p className="text-4xl font-bold text-green-600">{cgpa}</p>
            </div>
        )}
      </div>

      {/* Render ONLY the latest semester's result table */}
      <SemesterResultTable semesterBlock={latestSemester} />

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// --- Component for a single semester's result table ---
const SemesterResultTable = ({ semesterBlock }) => {
  const { semester, results, gpa } = semesterBlock;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center bg-gray-50 p-4">
            <h3 className="text-xl font-bold text-gray-700">Latest Result: Semester {semester}</h3>
            <div className="bg-indigo-100 p-2 rounded-lg text-center">
                <p className="text-xs font-medium text-indigo-800">GPA</p>
                <p className="text-xl font-bold text-indigo-600">{gpa}</p>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full min-w-full text-left table-auto">
            <thead className="bg-gray-50 border-t border-b border-gray-200">
                <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Credits</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Grade</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {results.map((subject) => (
                <tr key={subject.subject_code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{subject.subject_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.subject_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{subject.credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 text-center">{subject.grade}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    </div>
  )
}
