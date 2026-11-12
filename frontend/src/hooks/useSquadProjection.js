import { useMemo } from 'react';

// Quy tắc khắc chế giống hệt Backend
const ELEMENT_ADVANTAGE = {
  THERMAL: 'KINETIC', KINETIC: 'VOLT', VOLT: 'CYBER',
  CYBER: 'SONIC', SONIC: 'THERMAL', PLASMA: 'AETHER', AETHER: 'PLASMA',
};

export const useSquadProjection = (selectedCards, activeBoss) => {
  // useMemo giúp thuật toán chỉ chạy lại khi bạn đổi thẻ hoặc đổi tầng Boss, tối ưu hiệu năng theo đúng yêu cầu đề bài
  return useMemo(() => {
    if (!activeBoss || !selectedCards || selectedCards.length === 0) {
      return { projectedAtk: 0, projectedDef: 0, mechStatus: 'NONE' };
    }

    let rawAtk = 0;
    let totalDef = 0;
    let counterCount = 0;

    selectedCards.forEach(card => {
      const starMult = 1 + ((card.star_level || 1) - 1) * 0.2;
      let elemMult = 1.0;
      
      if (ELEMENT_ADVANTAGE[card.element] === activeBoss.element) elemMult = 1.5;
      else if (ELEMENT_ADVANTAGE[activeBoss.element] === card.element) elemMult = 0.75;

      rawAtk += Math.round(card.base_atk * starMult * elemMult);
      totalDef += Math.round(card.base_def * starMult);

      if (activeBoss.mech_element && card.element === activeBoss.mech_element) {
        counterCount++;
      }
    });

    let finalAtk = rawAtk;
    let finalReqDef = activeBoss.req_def;
    let mechStatus = 'OK';

    // Tính toán Mech
    if (activeBoss.mech_type === 'ELEMENT_SHIELD') {
      if (counterCount >= 1) finalAtk = Math.round(rawAtk * 1.15);
      else { finalAtk = Math.round(rawAtk * 0.6); mechStatus = 'FAILED'; }
    } else if (activeBoss.mech_type === 'DUAL_CORE_SHIELD') {
      if (counterCount >= 2) finalAtk = Math.round(rawAtk * 1.2);
      else { 
        finalAtk = Math.round(rawAtk * 0.5); 
        finalReqDef = Math.round(activeBoss.req_def * 1.2); 
        mechStatus = 'CRITICAL'; 
      }
    }

    return {
      projectedAtk: finalAtk,
      projectedDef: totalDef,
      reqAtk: activeBoss.req_atk,
      reqDef: finalReqDef,
      mechStatus,
      isAtkPassed: finalAtk >= activeBoss.req_atk,
      isDefPassed: totalDef >= finalReqDef
    };
  }, [selectedCards, activeBoss]);
};