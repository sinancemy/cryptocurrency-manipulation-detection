export default function Profile() {
  return (
    <div>
      <div className="text-yellow-50 bg-blue-50 mt-4 border-t border-b border-yellow-50">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img className="h-24 w-24" alt="profile picture" />
              <span className="text-xl ml-4">Name Surname</span>
            </div>
            <div>
              <button>Home</button>
              <button className="ml-2">Log Out</button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-24 lg:grid grid-cols-4 gap-4">
        <div className="col-start-2 col-end-3">
          <h1 className="text-2xl text-yellow-50 text-center">
            Coins that you follow
          </h1>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-yellow-50 bg-blue-50 mt-4 border-2 p-4 border-yellow-50 max-h-128 overflow-y-auto">
            {[
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
              {},
            ].map((_, i) => (
              <div key={i} className="text-center p-4">
                <img className="h-12 w-12 mx-auto" alt="image" />
                <p>bitcoin</p>
                <p>58.000,55</p>
              </div>
            ))}
          </div>
        </div>
        <div className="col-start-3 col-end-4">
          <h1 className="text-2xl text-yellow-50 text-center">
            Posts that you follow
          </h1>
          <div className="grid lg:grid-cols-2 gap-4 text-yellow-50 bg-blue-50 mt-4 border-2 p-4 border-yellow-50 max-h-128 overflow-y-auto">
            {[{}, {}, {}, {}, {}, {}, {}, {}].map((_, i) => (
              <div key={i} className="flex items-center p-4">
                <img className="h-24 w-24" alt="image" />
                <p className="ml-2">twitter/elonMusk</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
