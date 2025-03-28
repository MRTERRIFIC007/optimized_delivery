// Customer names for the backend (the backend uses names, not IDs)
export const customerMap: Record<string, string> = {
  cust001: "Aditya",
  cust002: "Vivaan",
  cust003: "Aarav",
  cust004: "Meera",
  cust005: "Diya",
  cust006: "Riya",
  cust007: "Ananya",
  cust008: "Aryan",
  cust009: "Ishaan",
  cust010: "Kabir",
};

// Real customer addresses in Ahmedabad
export const customerAddresses: Record<string, string> = {
  Aditya: "Near Jodhpur Cross Road, Satellite, Ahmedabad - 380015",
  Vivaan: "Near Bopal Cross Road, Bopal, Ahmedabad - 380058",
  Aarav: "Near Vastrapur Lake, Vastrapur, Ahmedabad - 380015",
  Meera: "Opposite Dharnidhar Derasar, Paldi, Ahmedabad - 380007",
  Diya: "Near Thaltej Cross Road, S.G. Highway, Ahmedabad - 380054",
  Riya: "Near Navrangpura AMTS Bus Stop, Navrangpura, Ahmedabad - 380009",
  Ananya: "Opposite Rajpath Club, Bodakdev, Ahmedabad - 380054",
  Aryan: "Near Oganaj Gam, Gota, Ahmedabad - 382481",
  Ishaan: "Opposite Rambaug Police Station, Maninagar, Ahmedabad - 380008",
  Kabir: "Near Chandkheda Gam Bus Stop, Chandkheda, Ahmedabad - 382424",
};

// Customer areas
export const customerAreas: Record<string, string> = {
  Aditya: "Satellite",
  Vivaan: "Bopal",
  Aarav: "Vastrapur",
  Meera: "Paldi",
  Diya: "Thaltej",
  Riya: "Navrangpura",
  Ananya: "Bodakdev",
  Aryan: "Gota",
  Ishaan: "Maninagar",
  Kabir: "Chandkheda",
};

// Helper function to get both customer area and address
export function getCustomerAreaAndAddress(customerName: string): {
  area: string;
  address: string;
} {
  return {
    area: customerAreas[customerName] || "Unknown",
    address: customerAddresses[customerName] || "",
  };
}

// Get customer ID from name
export function getCustomerIdFromName(name: string): string {
  for (const [id, customerName] of Object.entries(customerMap)) {
    if (customerName === name) {
      return id;
    }
  }
  return "";
}

// Get customer name from ID
export function getCustomerNameFromId(id: string): string {
  return customerMap[id] || "";
}
