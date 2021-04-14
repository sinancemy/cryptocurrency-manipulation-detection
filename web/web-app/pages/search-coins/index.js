export default function SearchCoins() {
  return (
    <div>
      <div className="mt-24 grid grid-cols-5">
        <h1 className=" col-start-3 col-end-4 text-4xl text-yellow-50 text-center">
          Search Coins
        </h1>
        <div className="col-start-3 col-end-4 text-yellow-50 bg-blue-50 mt-4 border-2 p-4 border-yellow-50 border-2 flex gap-7">
          <input
            type="text"
            placeholder="Search"
            className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full items-center mt-4"
          />
          <button>
            <img
              className="h-12 w-12 items-center fill-current text-yellow-50"
              src="search.png"
              alt="logo"
            />
          </button>
        </div>
        <div className="col-start-3 col-end-4 grid grid-cols-2 lg:grid-cols-3 gap-4 text-yellow-50 bg-blue-50 mt-4 border-2 p-4 border-yellow-50 max-h-128 overflow-y-auto">
          {[{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}].map(
            (_, i) => (
              <div key={i} className="text-center p-4">
                <img className="h-12 w-12 mx-auto" alt="image" />
                <p>coin</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
