/* Takes accessToken and refreshToken as inputs, and returns an object with keys 'accessToken' and 'refreshToken' as outputs.

If the current time is epsilon-close to timeoutPeriodInMinutes, the values in the returned object are the result of using the 
input refreshToken to generate a new access token and new refresh token.

If the current time isn't so, then the values in the returned object are the original values that were passed in as input.
*/
export async function swapTokens(oldThis: any, accessToken: string, refreshToken: string, startTime: number, timeoutPeriodInMinutes: number, epsilonInMinutes: number): Promise<Record<string, any>> {
    const minutesPerMillisecond = 1.667E-5;
    const totalTimeElapsedInMinutes = (Date.now() - startTime) * minutesPerMillisecond;
    const tokenAboutToExpire: boolean = Math.abs(totalTimeElapsedInMinutes - timeoutPeriodInMinutes) < epsilonInMinutes;  
    if (tokenAboutToExpire) {
        console.log("Token about to expire! Swapping tokens.");
        const tokenResponse = await oldThis.oAuthService.refreshToken(oldThis.sourceComplianceLevel, oldThis.sourceShard, 
            oldThis.sourceOAuthClientId, oldThis.sourceOAuthClientSecret, oldThis.sourceRefreshToken);
        return {
          'accessToken': tokenResponse.accessToken,
          'refreshToken': tokenResponse.refreshToken,
          'timeOfLastRefresh': Date.now()
        };
      }
    else {
      return {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'timeOfLastRefresh': startTime
      }
    }
  }

/* Returns true if and only if s is not epsilon-close to zero and s is epsilon-close to a multiple of t. */
function closeToNonzeroMultipleOf(s: number, t: number, epsilon: number): boolean {
    return (s > epsilon) && ((s % t) < epsilon);
}