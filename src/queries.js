const QUERIES = {
  Q1: {
    title: 'Vue Cohorte: Effectif, Age et Survie Globale',
    category: 'Clinical Stratification',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?age) AS ?avgAgeAtDiagnosis)
       (AVG(?osMonths) AS ?avgOverallSurvivalMonths)
WHERE {
  ?p a bc:Patient ;
     bc:hasAgeAtDiagnosis ?age ;
     bc:hasOverallSurvivalMonths ?osMonths .
}`
  },
  Q2: {
    title: 'Survie par Sous-type PAM50',
    category: 'Clinical Stratification',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?subtype
       (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?osMonths) AS ?avgSurvivalMonths)
WHERE {
  ?p a bc:Patient ;
     bc:hasOverallSurvivalMonths ?osMonths ;
     bc:hasDiagnosis ?d .
  ?d bc:hasPam50Subtype ?subtype .
}
GROUP BY ?subtype
ORDER BY DESC(?nPatients)`
  },
  Q3: {
    title: 'Survie par Profil Recepteur (ER/PR/HER2)',
    category: 'Clinical Stratification',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?er ?pr ?her2
       (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?osMonths) AS ?avgSurvivalMonths)
WHERE {
  ?p a bc:Patient ;
     bc:hasOverallSurvivalMonths ?osMonths ;
     bc:hasDiagnosis ?d .
    ?d bc:hasERStatus ?erRaw ;
      bc:hasPRStatus ?prRaw ;
      bc:hasHER2Status ?her2Raw .
    BIND(UCASE(STR(?erRaw)) AS ?er)
    BIND(UCASE(STR(?prRaw)) AS ?pr)
    BIND(UCASE(STR(?her2Raw)) AS ?her2)
}
GROUP BY ?er ?pr ?her2
HAVING (COUNT(DISTINCT ?p) >= 5)
ORDER BY DESC(?nPatients)`
  },
  Q4: {
    title: 'Resultats Cliniques par Stade Tumoral',
    category: 'Clinical Stratification',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?stage
       (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?size) AS ?avgTumorSize)
       (AVG(?osMonths) AS ?avgSurvivalMonths)
WHERE {
  ?p a bc:Patient ;
     bc:hasOverallSurvivalMonths ?osMonths ;
     bc:hasDiagnosis ?d .
  ?d bc:hasTumorStage ?stage ;
     bc:hasTumorSize ?size .
}
GROUP BY ?stage
ORDER BY ?stage`
  },
  Q5: {
    title: 'Efficacite Therapeutique par Sous-type',
    category: 'Treatment Analytics',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?subtype ?treatmentType
       (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?osMonths) AS ?avgSurvivalMonths)
WHERE {
  ?p a bc:Patient ;
     bc:hasOverallSurvivalMonths ?osMonths ;
     bc:hasDiagnosis ?d ;
     bc:hasTreatment ?t .
  ?d bc:hasPam50Subtype ?subtype .

  {
    ?t bc:hasChemotherapy ?chemo .
    FILTER(?chemo = 1)
    BIND("Chemotherapy" AS ?treatmentType)
  }
  UNION
  {
    ?t bc:hasHormoneTherapy ?horm .
    FILTER(?horm = 1)
    BIND("HormoneTherapy" AS ?treatmentType)
  }
  UNION
  {
    ?t bc:hasRadiotherapy ?radio .
    FILTER(?radio = 1)
    BIND("Radiotherapy" AS ?treatmentType)
  }
  UNION
  {
    ?t bc:hasTypeOfBreastSurgery ?surgeryType .
    BIND(CONCAT("Surgery:", STR(?surgeryType)) AS ?treatmentType)
  }
}
GROUP BY ?subtype ?treatmentType
HAVING (COUNT(DISTINCT ?p) >= 10)
ORDER BY ?subtype DESC(?avgSurvivalMonths)`
  },
  Q6: {
    title: 'Charge et Survie de la Cohorte Triple Negative',
    category: 'Treatment Analytics',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT (COUNT(DISTINCT ?p) AS ?nTripleNegative)
       (AVG(?osMonths) AS ?avgSurvivalMonths)
WHERE {
  ?p a bc:Patient ;
     bc:hasOverallSurvivalMonths ?osMonths ;
     bc:hasDiagnosis ?d .
    ?d bc:hasERStatus ?erRaw ;
      bc:hasPRStatus ?prRaw ;
      bc:hasHER2Status ?her2Raw .
    BIND(UCASE(STR(?erRaw)) AS ?er)
    BIND(UCASE(STR(?prRaw)) AS ?pr)
    BIND(UCASE(STR(?her2Raw)) AS ?her2)
    FILTER(REGEX(?er, "NEG"))
    FILTER(REGEX(?pr, "NEG"))
    FILTER(REGEX(?her2, "NEG"))
}`
  },
  Q7: {
    title: 'Genes les Plus Frequents en Mutation',
    category: 'Mutation Analytics',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?geneName
       (COUNT(DISTINCT ?p) AS ?mutatedPatients)
WHERE {
  ?p a bc:Patient ;
     bc:hasGeneMutation ?gm .
  ?gm bc:hasMutationGeneName ?geneName ;
      bc:hasMutationStatus ?status .
  FILTER(STR(?status) != "0")
}
GROUP BY ?geneName
ORDER BY DESC(?mutatedPatients)
LIMIT 30`
  },
  Q8: {
    title: 'Prevalence des Mutations par Sous-type',
    category: 'Mutation Analytics',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?subtype ?geneName
       (COUNT(DISTINCT ?p) AS ?mutationCount)
WHERE {
  ?p a bc:Patient ;
     bc:hasDiagnosis ?d ;
     bc:hasGeneMutation ?gm .
  ?d bc:hasPam50Subtype ?subtype .
  ?gm bc:hasMutationGeneName ?geneName ;
      bc:hasMutationStatus ?status .
  FILTER(STR(?status) != "0")
}
GROUP BY ?subtype ?geneName
HAVING (COUNT(DISTINCT ?p) >= 5)
ORDER BY ?subtype DESC(?mutationCount)`
  },
  Q9: {
    title: 'Reseau de Co-mutations Frequentes',
    category: 'Mutation Analytics',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?geneA ?geneB
       (COUNT(DISTINCT ?p) AS ?coMutationCount)
WHERE {
  ?p a bc:Patient ;
     bc:hasGeneMutation ?m1, ?m2 .
  ?m1 bc:hasMutationGeneName ?geneA ; bc:hasMutationStatus ?s1 .
  ?m2 bc:hasMutationGeneName ?geneB ; bc:hasMutationStatus ?s2 .
  FILTER(STR(?s1) != "0" && STR(?s2) != "0")
  FILTER(?geneA < ?geneB)
}
GROUP BY ?geneA ?geneB
HAVING (COUNT(DISTINCT ?p) >= 5)
ORDER BY DESC(?coMutationCount)
LIMIT 100`
  },
  Q10: {
    title: 'Profil d Expression Genique de Reference',
    category: 'Integrated Omics Risk',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?geneName
       (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?zScore) AS ?avgZScore)
WHERE {
  ?p a bc:Patient ;
     bc:hasGeneExpression ?ge .
  ?ge bc:hasExpressionGeneName ?geneName ;
      bc:hasZScore ?zScore .
}
GROUP BY ?geneName
HAVING (COUNT(DISTINCT ?p) >= 10)
ORDER BY DESC(?nPatients)
LIMIT 100`
  },
  Q11: {
    title: 'Correlation Expression Genique vs Mutation',
    category: 'Integrated Omics Risk',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?geneName ?hasMutation
       (COUNT(DISTINCT ?p) AS ?nPatients)
       (AVG(?zScore) AS ?avgZScore)
WHERE {
  ?p a bc:Patient ;
     bc:hasGeneExpression ?ge .
  ?ge bc:hasExpressionGeneName ?geneName ;
      bc:hasZScore ?zScore .

  OPTIONAL {
    ?p bc:hasGeneMutation ?gm .
    ?gm bc:hasMutationGeneName ?geneName ;
        bc:hasMutationStatus ?mutStatus .
    FILTER(STR(?mutStatus) != "0")
    BIND(true AS ?hasMutationRaw)
  }
  BIND(COALESCE(?hasMutationRaw, false) AS ?hasMutation)
}
GROUP BY ?geneName ?hasMutation
HAVING (COUNT(DISTINCT ?p) >= 10)
ORDER BY ?geneName ?hasMutation
LIMIT 100`
  },
  Q12: {
    title: 'Detection de Phenotypes Cliniques a Haut Risque',
    category: 'Integrated Omics Risk',
    sparql: `PREFIX bc: <http://example.org/bc#>
SELECT ?p
       (COUNT(DISTINCT ?gm) AS ?mutationCount)
       ?survivalMonths
WHERE {
  ?p a bc:Patient ;
     bc:hasOverallSurvivalMonths ?survivalMonths ;
     bc:hasDiagnosis ?d ;
     bc:hasGeneMutation ?gm .
  ?d bc:hasERStatus "Negative" ;
     bc:hasPRStatus "Negative" ;
     bc:hasHER2Status "Negative" .
  ?gm bc:hasMutationStatus ?status .
  FILTER(STR(?status) != "0")
  FILTER(?survivalMonths < 36)
}
GROUP BY ?p ?survivalMonths
HAVING (COUNT(DISTINCT ?gm) >= 3)
ORDER BY ?survivalMonths
LIMIT 50`
  }
};

module.exports = { QUERIES };
