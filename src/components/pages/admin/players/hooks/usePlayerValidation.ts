
import { findPlayerSessionMatch } from "@/services/core/playersSessionFetch";

export const usePlayerValidation = () => {
  const checkPlayerExists = async (
    firstName: string,
    lastName: string,
    birthDate: string,
    excludePlayerId?: number,
  ) => {
    try {
      return await findPlayerSessionMatch(firstName, lastName, birthDate, excludePlayerId);
    } catch (error) {
      console.error('Error checking player existence:', error);
      return null;
    }
  };

  const checkNameExists = async (
    firstName: string,
    lastName: string,
    excludePlayerId?: number,
  ) => {
    try {
      return await findPlayerSessionMatch(firstName, lastName, undefined, excludePlayerId);
    } catch (error) {
      console.error('Error checking name existence:', error);
      return null;
    }
  };

  const validatePlayerData = (firstName: string, lastName: string, birthDate: string) => {
    return firstName.trim() && lastName.trim() && birthDate;
  };

  return {
    checkPlayerExists,
    checkNameExists,
    validatePlayerData,
  };
};
