'use client';

import React, { useState, useEffect } from 'react';
import DashboardSection from '@/components/DashboardSection'; // ✅ Import Dashboard
import { EnrichedToken } from '@/lib/enrichWithPrices'; // ✅ Import Type
import LoadingIndicator from '@/components/ui/LoadingIndicator'; // (Optional) ถ้ามี
import { KPIRow } from '@/lib/getSheetKPIs';

export const dynamic = 'force-dynamic';
export default function DashboardPage() {
  return (
    <section className="py-12" id="dashboard">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">
              Dashboard
            </h2>
            <p className="text-earth-brown mt-4 text-base md:text-lg">
              Overview of your crypto portfolio performance
            </p>
          </div>
        </div>
        <DashboardSection />
      </div>
    </section>
  );
}
