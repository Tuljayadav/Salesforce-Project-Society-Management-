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
    public static void createFamilyWithHead(
    String familyName,
    String memberName,
    String address,
    Integer age,
    String phone
    ) {

    // Create Family
    Family__c fam = new Family__c();
    fam.Name = familyName;

    insert fam;

    //  Create Member
    Member__c mem = new Member__c();

    mem.Name = memberName;
    mem.Address__c = address;
    mem.Age__c = age;
    mem.Phone__c = phone;

    mem.Family__c = fam.Id;

    insert mem;

    //  Set Head of Family
    fam.Head_of_Family__c = mem.Id;

    update fam;
}

    @AuraEnabled(cacheable=true)
    public static List<Member__c> getFamilyMembers(Id familyId) {

    return [
        SELECT Id, Name
        FROM Member__c
        WHERE Family__c = :familyId
        ORDER BY Name
    ];
}
    @AuraEnabled
    public static void deleteFamily(Id familyId) {

    if(familyId != null){
        delete [SELECT Id FROM Family__c WHERE Id = :familyId LIMIT 1];
    }
}
   @AuraEnabled
    public static void updateFamily(Id familyId, String familyName,Id headId) {
        Family__c fam = new Family__c(
            Id = familyId,
            Name = familyName,
             Head_of_Family__c = headId
        );
        update fam;
    }
}