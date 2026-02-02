'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface PrizeBond {
  number: string;
  denomination?: number;
}

interface WinningBond {
  number: string;
  prize: string;
  denomination?: number;
}

interface MatchResult {
  bondNumber: string;
  prize: string;
  denomination?: number;
}

export default function Home() {
  const [myBonds, setMyBonds] = useState<PrizeBond[]>([]);
  const [winningBonds, setWinningBonds] = useState<WinningBond[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ myBonds: false, winningBonds: false });

  // New state for previews
  const [showMyBondsPreview, setShowMyBondsPreview] = useState(false);
  const [showWinningPreview, setShowWinningPreview] = useState(false);
  const [myBondsSearch, setMyBondsSearch] = useState('');
  const [winningSearch, setWinningSearch] = useState('');

  // Filtered lists for preview
  const filteredMyBonds = myBonds.filter(b => b.number.includes(myBondsSearch));
  const filteredWinning = winningBonds.filter(b => b.number.includes(winningSearch));

  // Parse Excel/CSV file
  const parseFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const fileExtension = file.name.split('.').pop()?.toLowerCase();

          if (fileExtension === 'csv') {
            // Parse CSV
            Papa.parse(file, {
              complete: (results) => {
                const numbers = results.data
                  .flat()
                  .filter((item: any) => item && String(item).trim())
                  .map((item: any) => String(item).trim());
                resolve(numbers);
              },
              error: (error) => reject(error)
            });
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            const numbers = jsonData
              .flat()
              .filter((item: any) => item && String(item).trim())
              .map((item: any) => String(item).trim());
            resolve(numbers);
          } else {
            reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv') {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  // Extract 6-digit numbers from text
  const extract6DigitNumbers = (text: string): string[] => {
    // Match all 6-digit numbers in the text
    const regex = /\b\d{6}\b/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches)] : []; // Remove duplicates
  };

  // Parse text file for winning numbers
  const parseTextFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const numbers = extract6DigitNumbers(text);
          resolve(numbers);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  };

  // Handle my bonds upload
  const handleMyBondsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const numbers = await parseFile(file);
      const bonds: PrizeBond[] = numbers.map(num => ({ number: num }));
      setMyBonds(bonds);
      setUploadStatus(prev => ({ ...prev, myBonds: true }));
      setMatches([]); // Clear previous matches
    } catch (error) {
      console.error('Error parsing my bonds file:', error);
      alert('Error reading file. Please ensure it\'s a valid Excel or CSV file.');
    }
  };

  // Handle winning bonds upload
  const handleWinningBondsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let numbers: string[];

      if (fileExtension === 'txt') {
        // Parse text file and extract 6-digit numbers
        numbers = await parseTextFile(file);
      } else {
        // Parse Excel/CSV files
        numbers = await parseFile(file);
      }

      // Create winning bonds array with prize information
      const bonds: WinningBond[] = numbers.map((num) => ({
        number: num,
        prize: 'Prize Winner' // You can customize this based on your needs
      }));

      setWinningBonds(bonds);
      setUploadStatus(prev => ({ ...prev, winningBonds: true }));
      setMatches([]); // Clear previous matches
    } catch (error) {
      console.error('Error parsing winning bonds file:', error);
      alert('Error reading file. Please ensure it\'s a valid text, Excel, or CSV file.');
    }
  };

  // Check for matches
  const checkMatches = () => {
    if (myBonds.length === 0 || winningBonds.length === 0) {
      alert('Please upload both files first!');
      return;
    }

    setIsChecking(true);

    // Simulate processing delay for better UX
    setTimeout(() => {
      const winningMap = new Map(winningBonds.map(wb => [wb.number, wb]));
      const foundMatches: MatchResult[] = [];

      myBonds.forEach(bond => {
        const winning = winningMap.get(bond.number);
        if (winning) {
          foundMatches.push({
            bondNumber: bond.number,
            prize: winning.prize,
            denomination: bond.denomination
          });
        }
      });

      setMatches(foundMatches);
      setIsChecking(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Prize Bond Checker
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check your winning bonds instantly</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Sample Templates Section */}
        <div className="mb-12 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-100 dark:border-purple-800">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    📋 Sample Templates
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download these files to see the expected format
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Not sure how to format your files? Download our sample templates to see exactly what format we expect. These are real examples you can use as a reference.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/750 bonds.xlsx"
                download
                className="group flex items-center space-x-3 bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    My Bonds Sample
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Excel format (.xlsx)
                  </p>
                </div>
              </a>

              <a
                href="/DRAW-RESULT.txt"
                download
                className="group flex items-center space-x-3 bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Winning Numbers Sample
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Text format (.txt)
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* My Bonds Upload */}
          <div className="animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 card-hover border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Prize Bonds</h2>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload your Excel or CSV file containing your prize bond numbers
              </p>

              <label className="block mb-4">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleMyBondsUpload}
                  className="hidden"
                  id="myBondsInput"
                />
                <div className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                  {uploadStatus.myBonds ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium text-lg">
                        {myBonds.length} bonds loaded
                      </p>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowMyBondsPreview(!showMyBondsPreview);
                          }}
                          className="text-sm px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                        >
                          {showMyBondsPreview ? 'Hide List' : 'Preview List'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('myBondsInput')?.click();
                          }}
                          className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Change File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Excel (.xlsx, .xls) or CSV files
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* My Bonds Preview List */}
              {showMyBondsPreview && uploadStatus.myBonds && (
                <div className="mt-4 animate-fadeIn">
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search bond number..."
                      value={myBondsSearch}
                      onChange={(e) => setMyBondsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400">#</th>
                          <th className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400">Bond Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredMyBonds.map((bond, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                            <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono font-medium text-gray-900 dark:text-gray-200">{bond.number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Winning Bonds Upload */}
          <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 card-hover border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Winning Numbers</h2>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload the government's winning numbers file (Text, Excel, or CSV)
              </p>

              <label className="block mb-4">
                <input
                  type="file"
                  accept=".txt,.xlsx,.xls,.csv"
                  onChange={handleWinningBondsUpload}
                  className="hidden"
                  id="winningBondsInput"
                />
                <div className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/10">
                  {uploadStatus.winningBonds ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                        {winningBonds.length} winners loaded
                      </p>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowWinningPreview(!showWinningPreview);
                          }}
                          className="text-sm px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                        >
                          {showWinningPreview ? 'Hide List' : 'Preview List'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('winningBondsInput')?.click();
                          }}
                          className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Change File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Text (.txt), Excel (.xlsx, .xls) or CSV files
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Winning Bonds Preview List */}
              {showWinningPreview && uploadStatus.winningBonds && (
                <div className="mt-4 animate-fadeIn">
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search winning number..."
                      value={winningSearch}
                      onChange={(e) => setWinningSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400">#</th>
                          <th className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400">Winning Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredWinning.map((bond, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                            <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono font-medium text-gray-900 dark:text-gray-200">{bond.number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Check Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={checkMatches}
            disabled={!uploadStatus.myBonds || !uploadStatus.winningBonds || isChecking}
            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isChecking ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Checking...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Check for Matches</span>
              </span>
            )}
          </button>
        </div>

        {/* Results Section */}
        {matches.length > 0 && (
          <div className="animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      🎉 Congratulations!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      You have {matches.length} winning bond{matches.length > 1 ? 's' : ''}!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl p-6 border-l-4 border-emerald-500 card-hover"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                          <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Bond Number</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                            {match.bondNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Prize</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                          {match.prize}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Matches Message */}
        {matches.length === 0 && uploadStatus.myBonds && uploadStatus.winningBonds && !isChecking && (
          <div className="animate-fadeIn">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Matches Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Unfortunately, none of your bonds matched the winning numbers this time.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-16 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-emerald-100 dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Use
          </h3>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</span>
              <span>Upload your Excel or CSV file containing your prize bond numbers in the first section</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</span>
              <span>Upload the government's winning numbers file (Text, Excel, or CSV) - the app will automatically extract all 6-digit prize bond numbers</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</span>
              <span>Click the "Check for Matches" button to see if you have any winning bonds</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">4</span>
              <span>View your results below - all winning bonds will be displayed with their prize information</span>
            </li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © 2026 Prize Bond Checker. Check your bonds securely and instantly.
          </p>
        </div>
      </footer>
    </div>
  );
}
