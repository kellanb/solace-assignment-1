"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { fetchAdvocates, type Advocate } from "@/lib/advocates";
import { filterAdvocatesByTerm } from "@/lib/search";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// Basic phone formatter so the numeric data we store is easier to skim/click.
const formatPhoneNumber = (value: number) => {
  const digits = value.toString().padStart(10, "0");
  const numericLink = digits.replace(/\D/g, "");
  const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
    6,
    10
  )}`;

  return { formatted, numericLink };
};

type ViewMode = "table" | "cards";

/**
 * Present advocates in a mobile-friendly card view. Mirrors the data shown in the table
 * but adds CTAs + badges so discovery feels more personal on smaller screens.
 */
const AdvocateCard = ({ advocate }: { advocate: Advocate }) => {
  const { formatted, numericLink } = formatPhoneNumber(advocate.phoneNumber);

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            {advocate.city}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {advocate.firstName} {advocate.lastName}
          </h3>
          <p className="text-sm text-slate-500">{advocate.degree}</p>
        </div>
        <Badge variant="brand">{advocate.yearsOfExperience}+ yrs</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {advocate.specialties.slice(0, 4).map((specialty, index) => (
          <Badge key={`${advocate.phoneNumber}-${specialty}-${index}`} variant="subtle">
            {specialty}
          </Badge>
        ))}
        {advocate.specialties.length > 4 && (
          <Badge variant="outline">
            +{advocate.specialties.length - 4} more
          </Badge>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <div>
          <p className="text-xs uppercase text-slate-500">Phone</p>
          <a
            href={`tel:${numericLink}`}
            className="text-lg font-semibold text-brand-700 hover:text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {formatted}
            <span className="sr-only">
              Call {advocate.firstName} {advocate.lastName}
            </span>
          </a>
        </div>
        <Button variant="secondary" size="sm">
          View profile
        </Button>
      </div>
    </Card>
  );
};

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [minExperience, setMinExperience] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  useEffect(() => {
    const controller = new AbortController();

    const loadAdvocates = async () => {
      setRequestStatus("loading");
      setRequestError(null);
      try {
        const data = await fetchAdvocates(controller.signal);
        setAdvocates(data);
        setRequestStatus("success");
      } catch (error) {
        // AbortController prevents state updates if the component unmounts
        // while an in-flight request completes (common during route changes).
        if (controller.signal.aborted) return;

        console.error("Failed to fetch advocates", error);
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        setRequestError(message);
        setRequestStatus("error");
      }
    };

    loadAdvocates();
    return () => controller.abort();
  }, []);

  // Derived city list drives the dropdown and updates automatically as data changes.
  const availableCities = useMemo(() => {
    const cities = new Set(advocates.map((advocate) => advocate.city));
    return ["all", ...Array.from(cities).sort()];
  }, [advocates]);

  // Grab the top specialties so we can suggest useful quick filters.
  const specialtyFrequencies = useMemo(() => {
    const counts = new Map<string, number>();
    advocates.forEach((advocate) => {
      advocate.specialties.forEach((specialty) => {
        counts.set(specialty, (counts.get(specialty) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [advocates]);

  // Filtering lives in dedicated helpers so we can share logic with future API tests.
  const searchResults = useMemo(() => {
    return filterAdvocatesByTerm(advocates, debouncedSearchTerm);
  }, [advocates, debouncedSearchTerm]);

  // Layer additional filters (city, specialties, experience) on top of the text search.
  const filteredAdvocates = useMemo(() => {
    return searchResults.filter((advocate) => {
      const matchesCity =
        selectedCity === "all" || advocate.city === selectedCity;
      const matchesSpecialty =
        selectedSpecialties.length === 0 ||
        selectedSpecialties.every((specialty) =>
          advocate.specialties.includes(specialty)
        );
      const matchesExperience = advocate.yearsOfExperience >= minExperience;

      return matchesCity && matchesSpecialty && matchesExperience;
    });
  }, [searchResults, selectedCity, selectedSpecialties, minExperience]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCity("all");
    setSelectedSpecialties([]);
    setMinExperience(0);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((previous) =>
      previous.includes(specialty)
        ? previous.filter((item) => item !== specialty)
        : [...previous, specialty]
    );
  };
  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
  };
  const handleExperienceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMinExperience(Number(event.target.value));
  };

  const shouldShowEmptyState =
    requestStatus === "success" && filteredAdvocates.length === 0;
  const hasResults = filteredAdvocates.length > 0;
  // We surface summaries + aria-live regions so patients understand what the
  // current view represents without needing to parse the whole table.
  const resultCountLabel =
    requestStatus === "success"
      ? `${filteredAdvocates.length.toLocaleString()} ${
          filteredAdvocates.length === 1 ? "advocate" : "advocates"
        }`
      : requestStatus === "loading"
      ? "Loading directory…"
      : "Directory unavailable";
  const activeFilters = {
    search: Boolean(debouncedSearchTerm),
    city: selectedCity !== "all",
    specialties: selectedSpecialties.length > 0,
    experience: minExperience > 0,
  };
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-hero-radial py-12 text-slate-900">
      <section className="container flex flex-col gap-10">
        <header className="overflow-hidden rounded-2xl bg-hero-radial p-8 shadow-soft-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge variant="brand" className="text-sm">
                Advocate Directory
              </Badge>
              <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
                Personalized support from Solace advocates
              </h1>
              <p className="text-lg text-slate-600">
                Search by name, specialty, location, or experience level to find
                the advocate who fits your goals. Our team supports telehealth
                and in-person care nationwide.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Telehealth available", "24/7 support", "HIPAA compliant"].map(
                  (item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  )
                )}
              </div>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button size="lg">Talk to patient care</Button>
                <Button variant="ghost" size="lg">
                  Learn about matching
                </Button>
              </div>
            </div>
            <Card className="max-w-sm flex-1 bg-glass-gradient text-slate-700">
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Patients helped
              </p>
              <p className="text-4xl font-bold text-slate-900">8,500+</p>
              <p className="mt-4 text-sm text-slate-600">
                “Solace made it effortless to find an advocate who understands
                my needs.” – Taylor, NYC
              </p>
            </Card>
          </div>
        </header>

        <Card className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label
                htmlFor="advocate-search"
                className="text-sm font-medium text-slate-700"
              >
                Search by name, city, or specialty
              </label>
              <Input
                id="advocate-search"
                type="search"
                className="mt-2"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Try “trauma”, “San Francisco”, or “Dr. Taylor”"
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleResetFilters}
                disabled={activeFilterCount === 0}
              >
                Clear all filters
              </Button>
              <Button onClick={() => setViewMode("cards")} variant="ghost">
                {viewMode === "cards" ? "Card view active" : "Switch to cards"}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                City
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                value={selectedCity}
                onChange={handleCityChange}
              >
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city === "all" ? "All cities" : city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Minimum years of experience
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={minExperience}
                onChange={handleExperienceChange}
                className="w-full accent-brand-600"
              />
              <p className="text-sm text-slate-500">{minExperience}+ years</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Popular specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {specialtyFrequencies.map((specialty) => (
                  <Pill
                    key={specialty}
                    variant={
                      selectedSpecialties.includes(specialty) ? "active" : "default"
                    }
                    onClick={() => handleSpecialtyToggle(specialty)}
                  >
                    {specialty}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <p className="font-medium text-slate-700">Active filters:</p>
              {debouncedSearchTerm && <Badge variant="outline">{debouncedSearchTerm}</Badge>}
              {selectedCity !== "all" && <Badge variant="outline">{selectedCity}</Badge>}
              {selectedSpecialties.map((specialty) => (
                <Badge key={`active-${specialty}`} variant="outline">
                  {specialty}
                </Badge>
              ))}
              {minExperience > 0 && (
                <Badge variant="outline">{minExperience}+ years</Badge>
              )}
            </div>
          )}
        </Card>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Matching results
              </p>
              <p className="text-2xl font-semibold text-slate-900" aria-live="polite">
                {resultCountLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">View:</span>
              <Button
                variant={viewMode === "table" ? "primary" : "secondary"}
                onClick={() => setViewMode("table")}
                size="sm"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "primary" : "secondary"}
                onClick={() => setViewMode("cards")}
                size="sm"
              >
                Cards
              </Button>
            </div>
          </div>

          <Card className="p-0">
            <div className="border-b border-slate-100 px-6 py-4">
              {requestStatus === "loading" && (
                <p
                  className="text-sm text-slate-600"
                  role="status"
                  aria-live="polite"
                >
                  Loading advocates…
                </p>
              )}
              {requestStatus === "error" && (
                <p className="text-sm text-rose-600" role="alert">
                  Something went wrong while loading advocates: {requestError}
                </p>
              )}
              {shouldShowEmptyState && (
                <p className="text-sm text-slate-600" role="status">
                  No advocates match your filters. Try adjusting or clearing your
                  selections.
                </p>
              )}
            </div>
            {hasResults && viewMode === "table" && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    List of Solace advocates, including location, specialty, and
                    contact number.
                  </caption>
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3">
                        City
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Degree
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Specialties
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Experience
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvocates.map((advocate) => {
                      const rowKey = `${advocate.firstName}-${advocate.lastName}-${advocate.phoneNumber}`;
                      const { formatted, numericLink } = formatPhoneNumber(
                        advocate.phoneNumber
                      );

                      return (
                        <tr
                          key={rowKey}
                          className="border-b border-slate-100 last:border-none odd:bg-white even:bg-slate-50"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-slate-900">
                            <div>{advocate.firstName} {advocate.lastName}</div>
                            <p className="text-xs text-slate-500">{advocate.degree}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {advocate.city}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {advocate.degree}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {advocate.specialties.slice(0, 3).map((specialty, index) => (
                                <Badge key={`${rowKey}-${specialty}-${index}`} variant="subtle">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {advocate.yearsOfExperience} yrs
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-brand-700">
                            <a
                              href={`tel:${numericLink}`}
                              className="hover:text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
                            >
                              {formatted}
                              <span className="sr-only">
                                Call {advocate.firstName} {advocate.lastName}
                              </span>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {hasResults && viewMode === "cards" && (
              <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAdvocates.map((advocate) => (
                  <AdvocateCard key={advocate.phoneNumber} advocate={advocate} />
                ))}
              </div>
            )}
          </Card>
        </section>

        <Card className="flex flex-col gap-4 bg-brand-50/50 text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-brand-700">
              Need help choosing?
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Our patient care team can match you in under 24 hours.
            </h2>
            <p className="text-sm text-slate-600">
              Share your preferences and we’ll introduce you to advocates who fit.
            </p>
          </div>
          <Button size="lg">Schedule a consult</Button>
        </Card>
      </section>
    </main>
  );
}
