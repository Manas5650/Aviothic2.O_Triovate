import React, { useState } from "react";

function SearchBar({ options, onAdd }) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setFiltered([]);
      return;
    }

    const results = options.filter((opt) =>
      opt.toLowerCase().includes(value.toLowerCase())
    );
    setFiltered(results);
  };

  const handleSelect = (sym) => {
    onAdd(sym);
    setQuery(""); 
    setFiltered([]);
  };

  return (
    <div style={{ position: "relative", width: "250px" }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search stock..."
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />
      {filtered.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "40px",
            left: 0,
            width: "100%",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "6px",
            listStyle: "none",
            margin: 0,
            padding: 0,
            zIndex: 1000,
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {filtered.map((sym) => (
            <li
              key={sym}
              onClick={() => handleSelect(sym)}
              style={{
                padding: "8px",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.target.style.background = "#f3f4f6")}
              onMouseOut={(e) => (e.target.style.background = "white")}
            >
              {sym}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;