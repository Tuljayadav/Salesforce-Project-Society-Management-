public with sharing class Familyservice {

    @AuraEnabled(cacheable=true)
    public static List<Family__c> searchFamily(String searchKey){
        if(String.isBlank(searchKey)) {
            searchKey = '';
        }

        return [
            SELECT Id, Name, Head_of_Family__c,
                   Head_of_Family__r.Name
            FROM Family__c
            WHERE Name LIKE :('%' + searchKey + '%')
            ORDER BY Name
        ];
    }


    @AuraEnabled
    public static Family__c createFamilyWithHead(String familyName) {

        Family__c fam = new Family__c();
        fam.Name = familyName;


        // if(headId != null){
        //     fam.Head_of_Family__c = headId;
        // }

        insert fam;
        return fam;
    }
    @AuraEnabled
public static void deleteFamily(Id familyId) {

    if(familyId != null){
        delete [SELECT Id FROM Family__c WHERE Id = :familyId LIMIT 1];
    }
}
@AuraEnabled
    public static void updateFamily(Id familyId, String familyName) {
        Family__c fam = new Family__c(
            Id = familyId,
            Name = familyName
        );
        update fam;
    }
}