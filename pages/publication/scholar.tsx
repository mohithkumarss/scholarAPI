"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

type ScholarResult = {
  title: string;
  link: string;
  authors: string;
  publicationDate: string;
  journal: string;
  citationCount: string;
};

type ScholarResponse = {
  results?: ScholarResult[];
  error?: string;
};

export default function Scholar() {
  const [results, setResults] = useState<ScholarResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ScholarResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<ScholarResponse>("/api/scholar");
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setResults(response.data.results || []);
          setFilteredResults(response.data.results || []);
        }
      } catch (err) {
        setError("Failed to fetch results");

        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterAndSortResults = useCallback(() => {
    let filtered = results.filter((result) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const authors = result.authors.toLowerCase();
      const year = parseInt(result.publicationDate.split("-")[0], 10);
      return (
        (result.title.toLowerCase().includes(lowerCaseQuery) ||
          authors.includes(lowerCaseQuery) ||
          result.publicationDate.includes(lowerCaseQuery)) &&
        (selectedYear ? year === selectedYear : true)
      );
    });

    setFilteredResults(filtered);
  }, [results, searchQuery, selectedYear]);

  useEffect(() => {
    filterAndSortResults();
  }, [searchQuery, selectedYear, filterAndSortResults]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (year: number) => {
    setSelectedYear(year);
  };

  const uniqueYears = Array.from(
    new Set(
      results.map((result) =>
        parseInt(result.publicationDate.split("-")[0], 10)
      )
    )
  );

  return (
    <div className="container mx-auto pt-32 w-[80%] p-4 text-white">
      <h1 className="text-2xl font-bold mb-8">Publications</h1>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="p-4 border rounded-md w-[20vw] bg-zinc-900 border-none text-sm text-white outline-none"
          placeholder="Search by title, year, or author"
        />
        <select
          onChange={(e) => handleFilter(Number(e.target.value))}
          className="p-4 text-sm border-none bg-zinc-900 text-white outline-none rounded-md mr-4"
        >
          <option value="">Filter by Year</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      {loading && <p>Loading...</p>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <ul>
        {filteredResults.map((result, index) => (
          <li key={index} className="mb-4 p-4 bg-zinc-900 rounded">
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="space-y-1 flex"
            >
              <div className="w-[60%]">
                <h2 className="max-w-[70%] font-bold mb-8">{result.title}</h2>
              </div>
              <div className="flex w-[20%] flex-col justify-between pr-4">
                <p className="text-xs mb-2">
                  <b className="text-sm">Authors:</b> <br /> {result.authors}
                </p>
              </div>
              <div className="flex w-[20%] flex-col justify-between pr-4">
                <p className="text-xs mb-2">
                  <b className="text-sm"> Journal:</b>
                  <br /> {result.journal}
                </p>
                <p className="text-xs mb-2">
                  <b className="text-sm"> Publication Date:</b>
                  <br /> {result.publicationDate}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
