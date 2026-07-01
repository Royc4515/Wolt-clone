export const calcAerialDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    const R = 6371; // Earth's radius in kilometers
    
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    
    return R * c;
};