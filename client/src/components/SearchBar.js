import React from "react";

const SearchBar = ({ searchQuery, setSearchQuery, searchLoading }) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearchChange}
      />
      {searchLoading && (
        <div className="search-loading">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
