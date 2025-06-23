export default function DashboardPage() {
  return (
    <section className="py-10" id="dashboard">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 section-heading">Dashboard</h2>
            <p className="text-earth-brown mt-4">Overview of your crypto portfolio performance</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button className="tab active px-4 py-2 rounded-md">1D</button>
            <button className="tab px-4 py-2 rounded-md">1W</button>
            <button className="tab px-4 py-2 rounded-md">1M</button>
            <button className="tab px-4 py-2 rounded-md">1Y</button>
            <button className="tab px-4 py-2 rounded-md">All</button>
          </div>
        </div>
        {/* เพิ่ม card, chart, table, recent transactions ตาม HTML เดิม */}
      </div>
    </section>
  );
}
