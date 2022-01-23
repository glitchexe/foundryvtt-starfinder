import { SFRPG } from "../../../config.js";
import { SFRPGEffectType, SFRPGModifierType, SFRPGModifierTypes } from "../../../modifiers/types.js";

export default function (engine) {
    engine.closures.add("calculateDamageMitigation", (fact, context) => {
        const data = fact.data;

        data.traits.damageMitigation = {
            damageReduction: [],
            damageReductionFirst: null,
            damageReductionTooltip: [],
            energyResistance: {}
        };

        const modifiers = fact.modifiers;
        const damageReductionModifiers = modifiers.filter(mod => { return mod.enabled && mod.modifierType === "constant" && [SFRPGEffectType.DAMAGE_REDUCTION].includes(mod.effectType); });
        const energyRessistanceModifiers = modifiers.filter(mod => { return mod.enabled && mod.modifierType === "constant" && [SFRPGEffectType.ENERGY_RESISTANCE].includes(mod.effectType); });

        for (const drModifier of damageReductionModifiers) {
            const modifierInfo = {
                value: drModifier.modifier,
                negatedBy: drModifier.valueAffected,
                source: drModifier
            };
            if (modifierInfo.negatedBy === "custom") {
                modifierInfo.negatedBy = drModifier.notes;
            }
            data.traits.damageMitigation.damageReduction.push(modifierInfo);
        }

        if (data.traits.damageMitigation.damageReduction.length > 0) {
            data.traits.damageMitigation.damageReduction.sort((x, y) => {
                return y.value - x.value;
            });

            data.traits.damageMitigation.damageReductionFirst = data.traits.damageMitigation.damageReduction[0];
        }

        for (const drModifier of data.traits.damageMitigation.damageReduction) {
            let negatedBy = "-";
            if (drModifier.negatedBy) {
                negatedBy = SFRPG.damageReductionTypes[drModifier.negatedBy];
                if (!negatedBy) {
                    negatedBy = drModifier.negatedBy;
                }
            }
            data.traits.damageMitigation.damageReductionTooltip.push(`${drModifier.source.name}: ${drModifier.value} / ${negatedBy}`);
        }

        for (const erModifier of energyRessistanceModifiers) {
            const modifierInfo = {
                value: erModifier.modifier,
                damageType: erModifier.valueAffected,
                source: erModifier
            };
            if (modifierInfo.negatedBy === "custom") {
                modifierInfo.damageType = erModifier.notes;
            }
            
            if (!data.traits.damageMitigation.energyResistance[modifierInfo.damageType] || data.traits.damageMitigation.energyResistance[modifierInfo.damageType].value < modifierInfo.value) {
                data.traits.damageMitigation.energyResistance[modifierInfo.damageType] = modifierInfo;
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}