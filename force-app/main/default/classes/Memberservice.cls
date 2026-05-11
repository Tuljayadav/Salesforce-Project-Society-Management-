public with sharing class Memberservice {

    @AuraEnabled(cacheable=true)
    public static List<Member__c> getMembers(String searchKey,Id familyId) {
        if(String.isBlank(searchKey)) searchKey = '';

        return [
            SELECT Id, Name, Address__c, Age__c, Phone__c
            FROM Member__c
            WHERE  Family__c = :familyId AND Name LIKE :('%' + searchKey + '%')
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static Member__c createMember(String name, String address, Integer age, String phone,Id familyId  ) {
        Member__c m = new Member__c();
           m.Name = name;
            m.address__c = address;
            m.age__c = age;
            m.phone__c = phone;
             m.family__c = familyId ;
        
        insert m;
        return m;
    }

    @AuraEnabled
    public static void updateMember(
            Id memberId,
            String name,
            String address,
            Integer age,
            String phone
) {

    Member__c m = new Member__c(
        Id = memberId,
        Name = name,
        address__c = address,
        age__c = age,
        phone__c = phone
    );

    update m;
}

    @AuraEnabled
    public static void deleteMember(Id memberId) {

    delete [
        SELECT Id
        FROM Member__c
        WHERE Id = :memberId
        LIMIT 1
    ];
}

}